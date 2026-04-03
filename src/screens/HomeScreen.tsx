import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, RefreshControl, Platform, Modal, TextInput, ActivityIndicator,
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

export default function HomeScreen({ navigation }: any) {
  const { user, buckets, goals, investableAmount, investments, recordInvestment, totalInvested } = useUser();
  const [refreshing, setRefreshing] = useState(false);
  const [nudge, setNudge] = useState('');
  const [market, setMarket] = useState<MarketData | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Investment modal
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [investBucket, setInvestBucket] = useState<'safe' | 'growth' | 'opportunity'>('growth');
  const [investAmount, setInvestAmount] = useState('');
  const [investNote, setInvestNote] = useState('');
  const [investGoalId, setInvestGoalId] = useState<string | undefined>(undefined);

  // Verdict modal (shows after recording)
  const [showVerdict, setShowVerdict] = useState(false);
  const [verdict, setVerdict] = useState<InvestmentVerdict | null>(null);

  // Expense modal
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('food');
  const [expenseNote, setExpenseNote] = useState('');

  useEffect(() => {
    setNudge(getDailyNudge(user));
    fetchMarket();
    fetchExpenses();
  }, []);

  const fetchMarket = async () => {
    try { const m = await getMarketData(); setMarket(m); } catch {}
  };

  const fetchExpenses = async () => {
    const exps = await loadExpenses();
    setExpenses(exps);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setNudge(getDailyNudge(user));
    fetchMarket();
    fetchExpenses();
    setTimeout(() => setRefreshing(false), 800);
  }, [user]);

  const totalWealth = buckets.reduce((s, b) => s + b.currentAmount, 0);
  const futureValue5y = calculateFutureValue(investableAmount, 12, 5);
  const futureValue10y = calculateFutureValue(investableAmount, 12, 10);

  const analysis = useMemo(() => {
    if (!user) return null;
    return analyzePortfolio(user, investments, buckets, goals);
  }, [user, investments, buckets, goals]);

  const expenseAnalysis: ExpenseAnalysis | null = useMemo(() => {
    if (!user) return null;
    return analyzeExpenses(expenses, user, investments);
  }, [expenses, user, investments]);

  const topAlerts = analysis?.insights.filter(i => i.severity === 'critical' || i.severity === 'warning').slice(0, 2) || [];

  // ── Investment recording with AI verdict ──
  const openInvestModal = (bucketId: 'safe' | 'growth' | 'opportunity') => {
    setInvestBucket(bucketId);
    setInvestAmount('');
    setInvestNote('');
    setInvestGoalId(undefined);
    setShowInvestModal(true);
  };

  const handleRecordInvestment = async () => {
    const amount = parseAmount(investAmount);
    if (amount <= 0) return;

    // Record it
    recordInvestment(amount, investBucket, investGoalId, investNote);
    setShowInvestModal(false);

    // Generate AI verdict
    if (market && user) {
      const emergencyGoal = goals.find(g => g.type === 'emergency');
      const emergencyPercent = emergencyGoal
        ? Math.round((emergencyGoal.currentAmount / emergencyGoal.targetAmount) * 100)
        : 0;
      const bucketTotal = buckets.find(b => b.id === investBucket)?.currentAmount || 0;

      const v = getInvestmentVerdict(
        amount, investBucket, market, user.riskLevel,
        bucketTotal, totalInvested, emergencyPercent,
      );
      setVerdict(v);
      setShowVerdict(true);
    }

    setInvestAmount('');
    setInvestNote('');
  };

  // ── Expense recording ──
  const handleRecordExpense = async () => {
    const amount = parseAmount(expenseAmount);
    if (amount <= 0) return;
    await saveExpense({ amount, category: expenseCategory, note: expenseNote, date: new Date().toISOString() });
    setShowExpenseModal(false);
    setExpenseAmount('');
    setExpenseNote('');
    fetchExpenses();
  };

  const bucketGoals = goals.filter(g => g.bucket === investBucket);

  if (!user) return null;

  const verdictColors: Record<string, string> = {
    excellent: '#10B981', good: '#3B82F6', caution: '#F59E0B', warning: '#EF4444',
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFF" />}
      >
        {/* ── Header ── */}
        <LinearGradient colors={['#0A0A1A', '#111340', '#1A1F71']} style={styles.header}>
          <View style={styles.headerContent}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>{getGreeting(user.name)}</Text>
              <Text style={styles.tagline}>Your AI money companion</Text>
            </View>
            <TouchableOpacity style={styles.profileIcon} onPress={() => navigation.navigate('Profile')}>
              <Text style={styles.profileText}>{user.name.charAt(0).toUpperCase()}</Text>
            </TouchableOpacity>
          </View>

          {/* Wealth Card */}
          <View style={styles.wealthCard}>
            <View style={styles.wealthRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.wealthLabel}>INVESTED</Text>
                <Text style={styles.wealthAmount}>{formatFullCurrency(totalWealth)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={styles.wealthLabel}>INVESTABLE/MO</Text>
                <Text style={styles.wealthAmount}>{formatFullCurrency(investableAmount)}</Text>
              </View>
            </View>
            <View style={styles.projectionRow}>
              <View style={styles.projectionItem}>
                <Text style={styles.projectionLabel}>5Y</Text>
                <Text style={styles.projectionValue}>{formatFullCurrency(futureValue5y)}</Text>
              </View>
              <View style={[styles.projectionItem, { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.08)', paddingLeft: 20 }]}>
                <Text style={styles.projectionLabel}>10Y</Text>
                <Text style={styles.projectionValue}>{formatFullCurrency(futureValue10y)}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* ── Market Pulse ── */}
          {market && (
            <View style={styles.marketCard}>
              <View style={styles.marketHeader}>
                <View style={[styles.liveDot, market.isLive && styles.liveDotActive]} />
                <Text style={styles.marketTitle}>MARKET PULSE</Text>
              </View>
              <View style={styles.marketRow}>
                <View style={styles.marketItem}>
                  <Text style={styles.marketLabel}>Nifty 50</Text>
                  <Text style={styles.marketValue}>{market.nifty50.value.toLocaleString()}</Text>
                  <Text style={[styles.marketChange, { color: market.nifty50.changePercent >= 0 ? '#10B981' : '#EF4444' }]}>
                    {market.nifty50.changePercent >= 0 ? '+' : ''}{market.nifty50.changePercent}%
                  </Text>
                </View>
                <View style={styles.marketItem}>
                  <Text style={styles.marketLabel}>Sentiment</Text>
                  <Text style={styles.marketSentiment}>
                    {market.marketSentiment === 'fear' ? '😰' : market.marketSentiment === 'greed' ? '🤑' : '😐'}
                  </Text>
                  <Text style={styles.marketSentimentLabel}>{market.marketSentiment}</Text>
                </View>
                <View style={styles.marketItem}>
                  <Text style={styles.marketLabel}>FD Rate</Text>
                  <Text style={styles.marketValue}>{market.fdRate}%</Text>
                  <Text style={styles.marketChange}>Real: {(market.fdRate - market.inflation).toFixed(1)}%</Text>
                </View>
              </View>
            </View>
          )}

          {/* ── AI Nudge ── */}
          <TouchableOpacity style={styles.nudgeCard} activeOpacity={0.85} onPress={() => navigation.navigate('Saathi')}>
            <View style={styles.nudgeHeader}>
              <View style={styles.nudgeDot} />
              <Text style={styles.nudgeTitle}>AI INSIGHT</Text>
            </View>
            <Text style={styles.nudgeText}>{nudge}</Text>
            <Text style={styles.nudgeAction}>Chat with Saathi →</Text>
          </TouchableOpacity>

          {/* ── Quick Actions ── */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20, marginHorizontal: -18 }} contentContainerStyle={{ paddingHorizontal: 18, gap: 10 }}>
            {[
              { emoji: '💰', label: 'Invest', color: '#EEF0FF', onPress: () => openInvestModal('growth') },
              { emoji: '💸', label: 'Expense', color: '#FEF2F2', onPress: () => setShowExpenseModal(true) },
              { emoji: '✨', label: 'Ask AI', color: '#F0FDF4', onPress: () => navigation.navigate('Saathi') },
              { emoji: '📊', label: 'SIP Calc', color: '#E8F5E9', onPress: () => navigation.navigate('SIPCalculator') },
              { emoji: '📚', label: 'Learn', color: '#F3E8FF', onPress: () => navigation.navigate('Learn') },
              { emoji: '🌱', label: 'Garden', color: '#F0FDF4', onPress: () => navigation.navigate('Garden') },
            ].map((a, i) => (
              <TouchableOpacity key={i} style={styles.actionChip} onPress={a.onPress} activeOpacity={0.7}>
                <View style={[styles.actionChipIcon, { backgroundColor: a.color }]}>
                  <Text style={{ fontSize: 18 }}>{a.emoji}</Text>
                </View>
                <Text style={styles.actionChipLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ── Expense Summary (if tracking) ── */}
          {expenseAnalysis && expenses.length > 0 && (
            <View style={styles.expenseCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Spending This Month</Text>
                <TouchableOpacity onPress={() => setShowExpenseModal(true)}>
                  <Text style={styles.viewAll}>+ Add</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.expenseRow}>
                <View>
                  <Text style={styles.expenseTotal}>₹{expenseAnalysis.totalThisMonth.toLocaleString('en-IN')}</Text>
                  <Text style={styles.expenseBudget}>of ₹{user.monthlyExpense.toLocaleString('en-IN')} budget</Text>
                </View>
                <View style={styles.budgetMeter}>
                  <View style={[styles.budgetFill, {
                    width: `${Math.min(100, expenseAnalysis.budgetUsed)}%`,
                    backgroundColor: expenseAnalysis.budgetUsed > 80 ? '#EF4444' : expenseAnalysis.budgetUsed > 60 ? '#F59E0B' : '#10B981',
                  }]} />
                </View>
                <Text style={[styles.budgetPercent, {
                  color: expenseAnalysis.budgetUsed > 80 ? '#EF4444' : '#6B7280',
                }]}>{expenseAnalysis.budgetUsed}%</Text>
              </View>
              {expenseAnalysis.warnings.filter(w => w.severity === 'critical' || w.severity === 'warning').slice(0, 1).map(w => (
                <View key={w.id} style={styles.expenseWarning}>
                  <Text style={styles.expenseWarningText}>{w.title}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── AI Alerts ── */}
          {topAlerts.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>AI Alerts</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Insights')}>
                  <Text style={styles.viewAll}>All insights →</Text>
                </TouchableOpacity>
              </View>
              {topAlerts.map(alert => (
                <View key={alert.id} style={[styles.alertCard, { borderLeftColor: alert.severity === 'critical' ? '#EF4444' : '#F59E0B' }]}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertDesc}>{alert.description}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── Buckets ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Money Buckets</Text>
            {buckets.map(b => (
              <MoneyBucketCard key={b.id} bucket={b} investableAmount={investableAmount} onInvest={() => openInvestModal(b.id)} />
            ))}
          </View>

          {/* ── Recent Activity ── */}
          {investments.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              {investments.slice(0, 4).map(inv => {
                const bName = inv.bucket === 'safe' ? '🟢' : inv.bucket === 'growth' ? '🟡' : '🔴';
                const g = inv.goalId ? goals.find(gl => gl.id === inv.goalId) : null;
                const d = new Date(inv.date);
                return (
                  <View key={inv.id} style={styles.activityItem}>
                    <Text style={styles.activityBucket}>{bName}</Text>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.activityNote}>{inv.note || (g ? g.name : 'Investment')}</Text>
                      <Text style={styles.activityDate}>{d.getDate()}/{d.getMonth() + 1}</Text>
                    </View>
                    <Text style={styles.activityAmount}>+₹{inv.amount.toLocaleString('en-IN')}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* ── Goals ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Goals</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Goals')}><Text style={styles.viewAll}>View all →</Text></TouchableOpacity>
            </View>
            {goals.slice(0, 2).map(g => <GoalCard key={g.id} goal={g} />)}
          </View>

          <View style={{ height: 30 }} />
        </View>
      </ScrollView>

      {/* ═══ Record Investment Modal ═══ */}
      <Modal visible={showInvestModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Record Investment</Text>
            <Text style={styles.modalSubtitle}>
              {investBucket === 'safe' ? '🟢 Safe' : investBucket === 'growth' ? '🟡 Growth' : '🔴 Opportunity'} Pocket
            </Text>

            <Text style={styles.fieldLabel}>Amount (₹)</Text>
            <TextInput style={styles.modalInput} placeholder="5000" placeholderTextColor="#C0C0C0" value={investAmount} onChangeText={setInvestAmount} keyboardType="numeric" autoFocus />

            {bucketGoals.length > 0 && (
              <>
                <Text style={styles.fieldLabel}>Link to Goal</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity style={[styles.chip, !investGoalId && styles.chipActive]} onPress={() => setInvestGoalId(undefined)}>
                      <Text style={[styles.chipText, !investGoalId && styles.chipTextActive]}>None</Text>
                    </TouchableOpacity>
                    {bucketGoals.map(g => (
                      <TouchableOpacity key={g.id} style={[styles.chip, investGoalId === g.id && styles.chipActive]} onPress={() => setInvestGoalId(g.id)}>
                        <Text style={[styles.chipText, investGoalId === g.id && styles.chipTextActive]}>{g.emoji} {g.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </>
            )}

            <Text style={styles.fieldLabel}>Note</Text>
            <TextInput style={styles.modalInput} placeholder="Monthly SIP" placeholderTextColor="#C0C0C0" value={investNote} onChangeText={setInvestNote} />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalBtnSecondary} onPress={() => setShowInvestModal(false)}>
                <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnPrimary} onPress={handleRecordInvestment}>
                <LinearGradient colors={['#1A1F71', '#3F51B5']} style={styles.modalBtnGradient}>
                  <Text style={styles.modalBtnPrimaryText}>Record ✅</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══ AI Verdict Modal (after recording) ═══ */}
      <Modal visible={showVerdict} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          {verdict && (
            <View style={styles.verdictCard}>
              <View style={[styles.verdictBadge, { backgroundColor: verdictColors[verdict.rating] }]}>
                <Text style={styles.verdictBadgeText}>
                  {verdict.rating === 'excellent' ? '🎯' : verdict.rating === 'good' ? '👍' : verdict.rating === 'caution' ? '⚠️' : '🚨'} {verdict.rating.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.verdictTitle}>{verdict.title}</Text>
              <Text style={styles.verdictMessage}>{verdict.message}</Text>
              {verdict.tips.map((tip, i) => (
                <View key={i} style={styles.verdictTip}>
                  <Text style={styles.verdictTipText}>• {tip}</Text>
                </View>
              ))}
              {market && market.sectorHighlights.length > 0 && (
                <View style={styles.verdictMarket}>
                  <Text style={styles.verdictMarketTitle}>Market Signals</Text>
                  {market.sectorHighlights.slice(0, 2).map((s, i) => (
                    <Text key={i} style={styles.verdictMarketItem}>
                      {s.trend === 'bullish' ? '📈' : s.trend === 'bearish' ? '📉' : '➡️'} {s.name}: {s.note}
                    </Text>
                  ))}
                </View>
              )}
              <TouchableOpacity style={styles.verdictClose} onPress={() => setShowVerdict(false)}>
                <Text style={styles.verdictCloseText}>Got it 👍</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* ═══ Expense Modal ═══ */}
      <Modal visible={showExpenseModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Track Expense 💸</Text>

            <Text style={styles.fieldLabel}>Amount (₹)</Text>
            <TextInput style={styles.modalInput} placeholder="500" placeholderTextColor="#C0C0C0" value={expenseAmount} onChangeText={setExpenseAmount} keyboardType="numeric" autoFocus />

            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {EXPENSE_CATEGORIES.map(c => (
                  <TouchableOpacity key={c.key} style={[styles.chip, expenseCategory === c.key && styles.chipActive]} onPress={() => setExpenseCategory(c.key)}>
                    <Text style={[styles.chipText, expenseCategory === c.key && styles.chipTextActive]}>{c.emoji} {c.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.fieldLabel}>Note</Text>
            <TextInput style={styles.modalInput} placeholder="Zomato order" placeholderTextColor="#C0C0C0" value={expenseNote} onChangeText={setExpenseNote} />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalBtnSecondary} onPress={() => setShowExpenseModal(false)}>
                <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnPrimary} onPress={handleRecordExpense}>
                <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.modalBtnGradient}>
                  <Text style={styles.modalBtnPrimaryText}>Record Expense</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FC' },
  header: { paddingTop: Platform.OS === 'ios' ? 58 : 44, paddingBottom: 70, paddingHorizontal: 20 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 20, fontWeight: '700', color: '#FFF', letterSpacing: -0.3 },
  tagline: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  profileIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  profileText: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  wealthCard: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 16, marginTop: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  wealthRow: { flexDirection: 'row', alignItems: 'center' },
  wealthLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, fontWeight: '600' },
  wealthAmount: { fontSize: 20, fontWeight: '800', color: '#FFF', marginTop: 2 },
  divider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 14 },
  projectionRow: { flexDirection: 'row', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  projectionItem: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  projectionLabel: { fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: '600' },
  projectionValue: { fontSize: 14, fontWeight: '700', color: '#81C784' },
  content: { marginTop: -44, paddingHorizontal: 18 },

  // Market
  marketCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 14, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 2 },
  marketHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D1D5DB', marginRight: 6 },
  liveDotActive: { backgroundColor: '#10B981' },
  marketTitle: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1 },
  marketRow: { flexDirection: 'row', justifyContent: 'space-around' },
  marketItem: { alignItems: 'center' },
  marketLabel: { fontSize: 10, color: '#9CA3AF', marginBottom: 2 },
  marketValue: { fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
  marketChange: { fontSize: 11, fontWeight: '600', color: '#6B7280', marginTop: 1 },
  marketSentiment: { fontSize: 22 },
  marketSentimentLabel: { fontSize: 10, color: '#6B7280', textTransform: 'capitalize', fontWeight: '600' },

  // Nudge
  nudgeCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 14, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: '#FF9933', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  nudgeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  nudgeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#FF9933', marginRight: 6 },
  nudgeTitle: { fontSize: 10, fontWeight: '700', color: '#FF9933', letterSpacing: 1 },
  nudgeText: { fontSize: 13, color: '#374151', lineHeight: 19 },
  nudgeAction: { fontSize: 12, color: '#1A1F71', fontWeight: '600', marginTop: 8 },

  // Quick actions
  actionChip: { alignItems: 'center', width: 62 },
  actionChipIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  actionChipLabel: { fontSize: 10, fontWeight: '600', color: '#6B7280' },

  // Expense
  expenseCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 14, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  expenseRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 10 },
  expenseTotal: { fontSize: 18, fontWeight: '800', color: '#1A1A2E' },
  expenseBudget: { fontSize: 10, color: '#9CA3AF' },
  budgetMeter: { flex: 1, height: 6, backgroundColor: '#F0F0F5', borderRadius: 3, overflow: 'hidden' },
  budgetFill: { height: '100%', borderRadius: 3 },
  budgetPercent: { fontSize: 12, fontWeight: '700', width: 36, textAlign: 'right' },
  expenseWarning: { backgroundColor: '#FEF3C7', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginTop: 8 },
  expenseWarningText: { fontSize: 11, color: '#92400E', fontWeight: '600' },

  // Section
  section: { marginBottom: 18 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A2E', letterSpacing: -0.3 },
  sectionSubtitle: { fontSize: 11, color: '#9CA3AF', marginBottom: 10 },
  viewAll: { fontSize: 12, color: '#1A1F71', fontWeight: '600' },

  // Alerts
  alertCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 8, borderLeftWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 3, elevation: 1 },
  alertTitle: { fontSize: 12, fontWeight: '700', color: '#1A1A2E', marginBottom: 2 },
  alertDesc: { fontSize: 11, color: '#6B7280', lineHeight: 16 },

  // Activity
  activityItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 6 },
  activityBucket: { fontSize: 16 },
  activityNote: { fontSize: 13, fontWeight: '600', color: '#374151' },
  activityDate: { fontSize: 10, color: '#9CA3AF', marginTop: 1 },
  activityAmount: { fontSize: 14, fontWeight: '700', color: '#10B981' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: Platform.OS === 'ios' ? 36 : 22, maxHeight: '85%' },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A2E' },
  modalSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2, marginBottom: 16 },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: '#9CA3AF', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  modalInput: { backgroundColor: '#F5F5FA', borderRadius: 12, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 13 : 10, fontSize: 16, fontWeight: '600', color: '#1A1A2E', marginBottom: 14 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F5F5FA', borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#1A1F71', borderColor: '#1A1F71' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  chipTextActive: { color: '#FFF' },
  modalBtnRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  modalBtnSecondary: { flex: 1, paddingVertical: 13, alignItems: 'center', borderRadius: 12, backgroundColor: '#F5F5FA' },
  modalBtnSecondaryText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  modalBtnPrimary: { flex: 2, borderRadius: 12, overflow: 'hidden' },
  modalBtnGradient: { paddingVertical: 13, alignItems: 'center', borderRadius: 12 },
  modalBtnPrimaryText: { fontSize: 14, fontWeight: '700', color: '#FFF' },

  // Verdict
  verdictCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 24, marginHorizontal: 20, marginBottom: 40, alignSelf: 'center', width: width - 40 },
  verdictBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginBottom: 12 },
  verdictBadgeText: { color: '#FFF', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  verdictTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A2E', marginBottom: 6 },
  verdictMessage: { fontSize: 14, color: '#374151', lineHeight: 21, marginBottom: 10 },
  verdictTip: { paddingVertical: 4 },
  verdictTipText: { fontSize: 13, color: '#6B7280', lineHeight: 19 },
  verdictMarket: { backgroundColor: '#F8F9FC', borderRadius: 12, padding: 12, marginTop: 10 },
  verdictMarketTitle: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5, marginBottom: 6 },
  verdictMarketItem: { fontSize: 12, color: '#374151', lineHeight: 18 },
  verdictClose: { backgroundColor: '#1A1F71', borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 14 },
  verdictCloseText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});

