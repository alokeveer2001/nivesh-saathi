import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, RefreshControl, Platform, Modal, TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useUser } from '../context/UserContext';
import MoneyBucketCard from '../components/MoneyBucketCard';
import GoalCard from '../components/GoalCard';
import { formatFullCurrency, getGreeting, calculateFutureValue, parseAmount } from '../utils/helpers';
import { getDailyNudge } from '../services/aiService';
import { analyzePortfolio } from '../services/portfolioAnalyzer';
import { getMarketData, getInvestmentVerdict, MarketData, InvestmentVerdict } from '../services/marketIntelligence';
import {
  loadExpenses, saveExpense, analyzeExpenses, Expense, ExpenseAnalysis,
  EXPENSE_CATEGORIES, ExpenseCategory,
} from '../services/expenseIntelligence';

const { width } = Dimensions.get('window');
const C = {
  bg: '#0B0B0F', surface: '#111118', elevated: '#18181F', input: '#1E1E28',
  primary: '#6C63FF', accent: '#F59E0B', success: '#34D399', error: '#F87171', warning: '#FBBF24',
  text: '#F0F0F5', textSec: '#9CA3AF', textMuted: '#6B7280',
  border: 'rgba(255,255,255,0.06)', borderActive: 'rgba(108,99,255,0.3)',
};

export default function HomeScreen({ navigation }: any) {
  const { user, buckets, goals, investableAmount, investments, recordInvestment, totalInvested } = useUser();
  const [refreshing, setRefreshing] = useState(false);
  const [nudge, setNudge] = useState('');
  const [market, setMarket] = useState<MarketData | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [showInvestModal, setShowInvestModal] = useState(false);
  const [investBucket, setInvestBucket] = useState<'safe' | 'growth' | 'opportunity'>('growth');
  const [investAmount, setInvestAmount] = useState('');
  const [investNote, setInvestNote] = useState('');
  const [investGoalId, setInvestGoalId] = useState<string | undefined>(undefined);

  const [showVerdict, setShowVerdict] = useState(false);
  const [verdict, setVerdict] = useState<InvestmentVerdict | null>(null);

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('food');
  const [expenseNote, setExpenseNote] = useState('');

  useEffect(() => {
    setNudge(getDailyNudge(user));
    getMarketData().then(setMarket).catch(() => {});
    loadExpenses().then(setExpenses);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setNudge(getDailyNudge(user));
    getMarketData().then(setMarket).catch(() => {});
    loadExpenses().then(setExpenses);
    setTimeout(() => setRefreshing(false), 800);
  }, [user]);

  const totalWealth = buckets.reduce((s, b) => s + b.currentAmount, 0);
  const fv5 = calculateFutureValue(investableAmount, 12, 5);
  const fv10 = calculateFutureValue(investableAmount, 12, 10);

  const analysis = useMemo(() => user ? analyzePortfolio(user, investments, buckets, goals) : null, [user, investments, buckets, goals]);
  const expAnalysis = useMemo(() => user ? analyzeExpenses(expenses, user, investments) : null, [expenses, user, investments]);
  const topAlerts = analysis?.insights.filter(i => i.severity === 'critical' || i.severity === 'warning').slice(0, 2) || [];

  const openInvestModal = (b: 'safe' | 'growth' | 'opportunity') => {
    setInvestBucket(b); setInvestAmount(''); setInvestNote(''); setInvestGoalId(undefined); setShowInvestModal(true);
  };

  const handleRecordInvestment = async () => {
    const amt = parseAmount(investAmount);
    if (amt <= 0) return;
    recordInvestment(amt, investBucket, investGoalId, investNote);
    setShowInvestModal(false);
    if (market && user) {
      const eGoal = goals.find(g => g.type === 'emergency');
      const ePct = eGoal ? Math.round((eGoal.currentAmount / eGoal.targetAmount) * 100) : 0;
      const bTotal = buckets.find(b => b.id === investBucket)?.currentAmount || 0;
      const v = getInvestmentVerdict(amt, investBucket, market, user.riskLevel, bTotal, totalInvested, ePct);
      setVerdict(v); setShowVerdict(true);
    }
    setInvestAmount(''); setInvestNote('');
  };

  const handleRecordExpense = async () => {
    const amt = parseAmount(expenseAmount);
    if (amt <= 0) return;
    await saveExpense({ amount: amt, category: expenseCategory, note: expenseNote, date: new Date().toISOString() });
    setShowExpenseModal(false); setExpenseAmount(''); setExpenseNote('');
    loadExpenses().then(setExpenses);
  };

  const bucketGoals = goals.filter(g => g.bucket === investBucket);
  if (!user) return null;

  const vColors: Record<string, string> = { excellent: C.success, good: '#60A5FA', caution: C.warning, warning: C.error };

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.textMuted} />}>

        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.greeting}>{getGreeting(user.name)}</Text>
              <Text style={s.tagline}>Your AI money companion</Text>
            </View>
            <TouchableOpacity style={s.avatar} onPress={() => navigation.navigate('Profile')}>
              <Text style={s.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
            </TouchableOpacity>
          </View>

          {/* Wealth */}
          <View style={s.wealthCard}>
            <View style={s.wealthTop}>
              <View>
                <Text style={s.wLabel}>INVESTED</Text>
                <Text style={s.wValue}>{formatFullCurrency(totalWealth)}</Text>
              </View>
              <View style={s.wDivider} />
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.wLabel}>INVESTABLE/MO</Text>
                <Text style={s.wValue}>{formatFullCurrency(investableAmount)}</Text>
              </View>
            </View>
            <View style={s.wBottom}>
              <View style={s.wProj}>
                <Text style={s.wProjLabel}>5Y</Text>
                <Text style={s.wProjVal}>{formatFullCurrency(fv5)}</Text>
              </View>
              <View style={[s.wProj, { borderLeftWidth: 1, borderLeftColor: C.border, paddingLeft: 16 }]}>
                <Text style={s.wProjLabel}>10Y</Text>
                <Text style={s.wProjVal}>{formatFullCurrency(fv10)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={s.body}>
          {/* ── Market Pulse ── */}
          {market && (
            <View style={s.card}>
              <View style={s.cardHeader}>
                <View style={[s.dot, market.isLive && { backgroundColor: C.success }]} />
                <Text style={s.cardLabel}>MARKET</Text>
              </View>
              <View style={s.marketRow}>
                <View style={s.marketItem}>
                  <Text style={s.mLabel}>Nifty 50</Text>
                  <Text style={s.mValue}>{market.nifty50.value.toLocaleString()}</Text>
                  <Text style={[s.mChange, { color: market.nifty50.changePercent >= 0 ? C.success : C.error }]}>
                    {market.nifty50.changePercent >= 0 ? '+' : ''}{market.nifty50.changePercent}%
                  </Text>
                </View>
                <View style={s.marketItem}>
                  <Text style={s.mLabel}>Mood</Text>
                  <Text style={{ fontSize: 20 }}>{market.marketSentiment === 'fear' ? '😰' : market.marketSentiment === 'greed' ? '🤑' : '😐'}</Text>
                  <Text style={s.mLabel}>{market.marketSentiment}</Text>
                </View>
                <View style={s.marketItem}>
                  <Text style={s.mLabel}>FD Real</Text>
                  <Text style={s.mValue}>{(market.fdRate - market.inflation).toFixed(1)}%</Text>
                  <Text style={s.mLabel}>post-inflation</Text>
                </View>
              </View>
            </View>
          )}

          {/* ── AI Nudge ── */}
          <TouchableOpacity style={s.nudge} activeOpacity={0.8} onPress={() => navigation.navigate('Saathi')}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <View style={s.nudgeDot} />
              <Text style={s.nudgeLabel}>AI INSIGHT</Text>
            </View>
            <Text style={s.nudgeText}>{nudge}</Text>
            <Text style={s.nudgeAction}>Chat with Saathi →</Text>
          </TouchableOpacity>

          {/* ── Quick Actions ── */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20, marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
            {[
              { emoji: '💰', label: 'Invest', onPress: () => openInvestModal('growth') },
              { emoji: '💸', label: 'Expense', onPress: () => setShowExpenseModal(true) },
              { emoji: '✨', label: 'Ask AI', onPress: () => navigation.navigate('Saathi') },
              { emoji: '📊', label: 'SIP Calc', onPress: () => navigation.navigate('SIPCalculator') },
              { emoji: '📚', label: 'Learn', onPress: () => navigation.navigate('Learn') },
              { emoji: '🌱', label: 'Garden', onPress: () => navigation.navigate('Garden') },
            ].map((a, i) => (
              <TouchableOpacity key={i} style={s.qAction} onPress={a.onPress} activeOpacity={0.7}>
                <View style={s.qIcon}><Text style={{ fontSize: 18 }}>{a.emoji}</Text></View>
                <Text style={s.qLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ── Expense Summary ── */}
          {expAnalysis && expenses.length > 0 && (
            <View style={s.card}>
              <View style={s.cardHeaderRow}>
                <Text style={s.sectionTitle}>Spending</Text>
                <TouchableOpacity onPress={() => setShowExpenseModal(true)}><Text style={s.link}>+ Add</Text></TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 }}>
                <Text style={s.expTotal}>₹{expAnalysis.totalThisMonth.toLocaleString('en-IN')}</Text>
                <View style={s.budgetBar}>
                  <View style={[s.budgetFill, {
                    width: `${Math.min(100, expAnalysis.budgetUsed)}%`,
                    backgroundColor: expAnalysis.budgetUsed > 80 ? C.error : expAnalysis.budgetUsed > 60 ? C.warning : C.success,
                  }]} />
                </View>
                <Text style={[s.budgetPct, { color: expAnalysis.budgetUsed > 80 ? C.error : C.textMuted }]}>{expAnalysis.budgetUsed}%</Text>
              </View>
            </View>
          )}

          {/* ── Alerts ── */}
          {topAlerts.length > 0 && (
            <View style={s.section}>
              <View style={s.cardHeaderRow}>
                <Text style={s.sectionTitle}>AI Alerts</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Insights')}><Text style={s.link}>All →</Text></TouchableOpacity>
              </View>
              {topAlerts.map(a => (
                <View key={a.id} style={[s.alertCard, { borderLeftColor: a.severity === 'critical' ? C.error : C.warning }]}>
                  <Text style={s.alertTitle}>{a.title}</Text>
                  <Text style={s.alertDesc}>{a.description}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── Buckets ── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Money Buckets</Text>
            {buckets.map(b => (
              <MoneyBucketCard key={b.id} bucket={b} investableAmount={investableAmount} onInvest={() => openInvestModal(b.id)} />
            ))}
          </View>

          {/* ── Activity ── */}
          {investments.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Recent Activity</Text>
              {investments.slice(0, 4).map(inv => {
                const dot = inv.bucket === 'safe' ? C.success : inv.bucket === 'growth' ? C.warning : '#F472B6';
                const g = inv.goalId ? goals.find(gl => gl.id === inv.goalId) : null;
                const d = new Date(inv.date);
                return (
                  <View key={inv.id} style={s.actItem}>
                    <View style={[s.actDot, { backgroundColor: dot }]} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={s.actNote}>{inv.note || (g ? g.name : 'Investment')}</Text>
                      <Text style={s.actDate}>{d.getDate()}/{d.getMonth() + 1}</Text>
                    </View>
                    <Text style={s.actAmt}>+₹{inv.amount.toLocaleString('en-IN')}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* ── Goals ── */}
          <View style={s.section}>
            <View style={s.cardHeaderRow}>
              <Text style={s.sectionTitle}>Goals</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Goals')}><Text style={s.link}>View all →</Text></TouchableOpacity>
            </View>
            {goals.slice(0, 2).map(g => <GoalCard key={g.id} goal={g} />)}
          </View>

          <View style={{ height: 30 }} />
        </View>
      </ScrollView>

      {/* ═══ INVEST MODAL ═══ */}
      <Modal visible={showInvestModal} transparent animationType="slide">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={s.modalBg} activeOpacity={1} onPress={() => setShowInvestModal(false)}>
            <TouchableOpacity activeOpacity={1} style={s.modalSheet}>
              <View style={s.handle} />
              <ScrollView showsVerticalScrollIndicator={false} bounces={false} keyboardShouldPersistTaps="handled">
                <Text style={s.modalTitle}>Record Investment</Text>
                <Text style={s.modalSub}>
                  {investBucket === 'safe' ? '🟢 Safe' : investBucket === 'growth' ? '🟡 Growth' : '🔴 Opportunity'} Pocket
                </Text>

                <Text style={s.fieldLabel}>AMOUNT (₹)</Text>
                <TextInput style={s.input} placeholder="5000" placeholderTextColor="#555" value={investAmount} onChangeText={setInvestAmount} keyboardType="numeric" autoFocus />

                {bucketGoals.length > 0 && (
                  <>
                    <Text style={s.fieldLabel}>LINK TO GOAL</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity style={[s.chip, !investGoalId && s.chipOn]} onPress={() => setInvestGoalId(undefined)}>
                          <Text style={[s.chipTxt, !investGoalId && s.chipTxtOn]}>None</Text>
                        </TouchableOpacity>
                        {bucketGoals.map(g => (
                          <TouchableOpacity key={g.id} style={[s.chip, investGoalId === g.id && s.chipOn]} onPress={() => setInvestGoalId(g.id)}>
                            <Text style={[s.chipTxt, investGoalId === g.id && s.chipTxtOn]}>{g.emoji} {g.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </>
                )}

                <Text style={s.fieldLabel}>NOTE</Text>
                <TextInput style={s.input} placeholder="Monthly SIP" placeholderTextColor="#555" value={investNote} onChangeText={setInvestNote} />

                <View style={s.btnRow}>
                  <TouchableOpacity style={s.btnSec} onPress={() => setShowInvestModal(false)}>
                    <Text style={s.btnSecTxt}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.btnPri} onPress={handleRecordInvestment}>
                    <LinearGradient colors={['#6C63FF', '#4F46E5']} style={s.btnGrad}>
                      <Text style={s.btnPriTxt}>Record ✅</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* ═══ VERDICT MODAL ═══ */}
      <Modal visible={showVerdict} transparent animationType="fade">
        <View style={s.verdictBg}>
          {verdict && (
            <View style={s.verdictCard}>
              <View style={[s.verdictBadge, { backgroundColor: vColors[verdict.rating] }]}>
                <Text style={s.verdictBadgeText}>
                  {verdict.rating === 'excellent' ? '🎯' : verdict.rating === 'good' ? '👍' : verdict.rating === 'caution' ? '⚠️' : '🚨'} {verdict.rating.toUpperCase()}
                </Text>
              </View>
              <Text style={s.verdictTitle}>{verdict.title}</Text>
              <Text style={s.verdictMsg}>{verdict.message}</Text>
              {verdict.tips.map((t, i) => <Text key={i} style={s.verdictTip}>• {t}</Text>)}
              {market && market.sectorHighlights.length > 0 && (
                <View style={s.verdictMkt}>
                  <Text style={s.verdictMktTitle}>Market Signals</Text>
                  {market.sectorHighlights.slice(0, 2).map((sig, i) => (
                    <Text key={i} style={s.verdictMktItem}>{sig.trend === 'bullish' ? '📈' : sig.trend === 'bearish' ? '📉' : '➡️'} {sig.name}: {sig.note}</Text>
                  ))}
                </View>
              )}
              <TouchableOpacity style={s.verdictBtn} onPress={() => setShowVerdict(false)}>
                <Text style={s.verdictBtnTxt}>Got it 👍</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* ═══ EXPENSE MODAL ═══ */}
      <Modal visible={showExpenseModal} transparent animationType="slide">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={s.modalBg} activeOpacity={1} onPress={() => setShowExpenseModal(false)}>
            <TouchableOpacity activeOpacity={1} style={s.modalSheet}>
              <View style={s.handle} />
              <ScrollView showsVerticalScrollIndicator={false} bounces={false} keyboardShouldPersistTaps="handled">
                <Text style={s.modalTitle}>Track Expense 💸</Text>

                <Text style={s.fieldLabel}>AMOUNT (₹)</Text>
                <TextInput style={s.input} placeholder="500" placeholderTextColor="#555" value={expenseAmount} onChangeText={setExpenseAmount} keyboardType="numeric" autoFocus />

                <Text style={s.fieldLabel}>CATEGORY</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {EXPENSE_CATEGORIES.map(c => (
                      <TouchableOpacity key={c.key} style={[s.chip, expenseCategory === c.key && s.chipOn]} onPress={() => setExpenseCategory(c.key)}>
                        <Text style={[s.chipTxt, expenseCategory === c.key && s.chipTxtOn]}>{c.emoji} {c.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                <Text style={s.fieldLabel}>NOTE</Text>
                <TextInput style={s.input} placeholder="Zomato order" placeholderTextColor="#555" value={expenseNote} onChangeText={setExpenseNote} />

                <View style={s.btnRow}>
                  <TouchableOpacity style={s.btnSec} onPress={() => setShowExpenseModal(false)}>
                    <Text style={s.btnSecTxt}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.btnPri} onPress={handleRecordExpense}>
                    <LinearGradient colors={[C.error, '#DC2626']} style={s.btnGrad}>
                      <Text style={s.btnPriTxt}>Record Expense</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  // Header
  header: { backgroundColor: C.bg, paddingTop: Platform.OS === 'ios' ? 58 : 44, paddingBottom: 20, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 20, fontWeight: '700', color: C.text, letterSpacing: -0.3 },
  tagline: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  avatar: { width: 36, height: 36, borderRadius: 12, backgroundColor: C.elevated, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.border },
  avatarText: { fontSize: 14, fontWeight: '800', color: C.primary },

  // Wealth
  wealthCard: { backgroundColor: C.surface, borderRadius: 16, padding: 16, marginTop: 14, borderWidth: 1, borderColor: C.border },
  wealthTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  wLabel: { fontSize: 10, color: C.textMuted, letterSpacing: 1, fontWeight: '600' },
  wValue: { fontSize: 22, fontWeight: '800', color: C.text, marginTop: 2 },
  wDivider: { width: 1, height: 28, backgroundColor: C.border },
  wBottom: { flexDirection: 'row', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  wProj: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  wProjLabel: { fontSize: 10, color: C.textMuted, fontWeight: '600' },
  wProjVal: { fontSize: 14, fontWeight: '700', color: C.success },

  body: { paddingHorizontal: 16 },

  // Card
  card: { backgroundColor: C.surface, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardLabel: { fontSize: 10, fontWeight: '700', color: C.textMuted, letterSpacing: 1 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.textMuted, marginRight: 6 },

  // Market
  marketRow: { flexDirection: 'row', justifyContent: 'space-around' },
  marketItem: { alignItems: 'center' },
  mLabel: { fontSize: 10, color: C.textMuted },
  mValue: { fontSize: 16, fontWeight: '800', color: C.text, marginVertical: 1 },
  mChange: { fontSize: 11, fontWeight: '600' },

  // Nudge
  nudge: { backgroundColor: C.surface, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: C.border, borderLeftWidth: 3, borderLeftColor: C.accent },
  nudgeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.accent, marginRight: 6 },
  nudgeLabel: { fontSize: 10, fontWeight: '700', color: C.accent, letterSpacing: 1 },
  nudgeText: { fontSize: 13, color: C.textSec, lineHeight: 19 },
  nudgeAction: { fontSize: 12, color: C.primary, fontWeight: '600', marginTop: 8 },

  // Quick actions
  qAction: { alignItems: 'center', width: 58 },
  qIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.elevated, justifyContent: 'center', alignItems: 'center', marginBottom: 4, borderWidth: 1, borderColor: C.border },
  qLabel: { fontSize: 10, fontWeight: '600', color: C.textMuted },

  // Expense
  expTotal: { fontSize: 17, fontWeight: '800', color: C.text },
  budgetBar: { flex: 1, height: 5, backgroundColor: C.input, borderRadius: 3, overflow: 'hidden' },
  budgetFill: { height: '100%', borderRadius: 3 },
  budgetPct: { fontSize: 12, fontWeight: '700', width: 34, textAlign: 'right' },

  // Section
  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.text, letterSpacing: -0.2, marginBottom: 8 },
  link: { fontSize: 12, color: C.primary, fontWeight: '600' },

  // Alerts
  alertCard: { backgroundColor: C.surface, borderRadius: 12, padding: 12, marginBottom: 6, borderLeftWidth: 3, borderWidth: 1, borderColor: C.border },
  alertTitle: { fontSize: 12, fontWeight: '700', color: C.text, marginBottom: 2 },
  alertDesc: { fontSize: 11, color: C.textMuted, lineHeight: 16 },

  // Activity
  actItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 12, padding: 12, marginBottom: 5, borderWidth: 1, borderColor: C.border },
  actDot: { width: 8, height: 8, borderRadius: 4 },
  actNote: { fontSize: 13, fontWeight: '600', color: C.text },
  actDate: { fontSize: 10, color: C.textMuted, marginTop: 1 },
  actAmt: { fontSize: 14, fontWeight: '700', color: C.success },

  // Modals
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: C.elevated, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: Platform.OS === 'ios' ? 40 : 22, maxHeight: '80%' },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#333', alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: C.text },
  modalSub: { fontSize: 13, color: C.textMuted, marginTop: 2, marginBottom: 16 },
  fieldLabel: { fontSize: 10, fontWeight: '600', color: C.textMuted, marginBottom: 6, letterSpacing: 1 },
  input: { backgroundColor: C.input, borderRadius: 12, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 13 : 10, fontSize: 16, fontWeight: '600', color: C.text, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: C.input, borderWidth: 1, borderColor: C.border },
  chipOn: { backgroundColor: C.primary, borderColor: C.primary },
  chipTxt: { fontSize: 12, fontWeight: '600', color: C.textMuted },
  chipTxtOn: { color: '#FFF' },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btnSec: { flex: 1, paddingVertical: 13, alignItems: 'center', borderRadius: 12, backgroundColor: C.input, borderWidth: 1, borderColor: C.border },
  btnSecTxt: { fontSize: 14, fontWeight: '600', color: C.textSec },
  btnPri: { flex: 2, borderRadius: 12, overflow: 'hidden' },
  btnGrad: { paddingVertical: 13, alignItems: 'center', borderRadius: 12 },
  btnPriTxt: { fontSize: 14, fontWeight: '700', color: '#FFF' },

  // Verdict
  verdictBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', paddingHorizontal: 20 },
  verdictCard: { backgroundColor: C.elevated, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: C.border },
  verdictBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginBottom: 12 },
  verdictBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  verdictTitle: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 6 },
  verdictMsg: { fontSize: 14, color: C.textSec, lineHeight: 21, marginBottom: 8 },
  verdictTip: { fontSize: 13, color: C.textMuted, lineHeight: 19, paddingVertical: 2 },
  verdictMkt: { backgroundColor: C.input, borderRadius: 12, padding: 12, marginTop: 8, borderWidth: 1, borderColor: C.border },
  verdictMktTitle: { fontSize: 10, fontWeight: '700', color: C.textMuted, letterSpacing: 0.5, marginBottom: 6 },
  verdictMktItem: { fontSize: 12, color: C.textSec, lineHeight: 18 },
  verdictBtn: { backgroundColor: C.primary, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 14 },
  verdictBtnTxt: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});

