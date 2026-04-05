import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform,
  RefreshControl, Modal, TextInput, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useUser } from '../context/UserContext';
import { analyzePortfolio } from '../services/portfolioAnalyzer';
import { getMarketData, MarketData } from '../services/marketIntelligence';
import { loadExpenses, analyzeExpenses, Expense, EXPENSE_CATEGORIES } from '../services/expenseIntelligence';
import {
  loadAssets, addAsset, loadLiabilities, addLiability, loadInsurance,
  loadWatchlist, addToWatchlist, removeFromWatchlist, loadLifeEvents,
  addLifeEvent, loadSignals, generateSignals, generateDailyBrief,
  calculateNetWorth, calculateTaxProfile, buildCompanionContext,
  saveSignals,
} from '../services/companionEngine';
import { formatFullCurrency, generateId } from '../utils/helpers';
import {
  Asset, Liability, InsurancePolicy, WatchlistItem, LifeEvent,
  AISignal, DailyBrief, NetWorth, TaxProfile, AssetClass,
} from '../types';

const { width } = Dimensions.get('window');
const C = {
  bg: '#0B0B0F', surface: '#111118', elevated: '#18181F', input: '#1E1E28',
  primary: '#6C63FF', accent: '#F59E0B', success: '#34D399', error: '#F87171', warning: '#FBBF24',
  text: '#F0F0F5', textSec: '#9CA3AF', textMuted: '#6B7280',
  border: 'rgba(255,255,255,0.06)',
};

const SIGNAL_ICONS: Record<string, string> = {
  buy: '📈', sell: '📉', hold: '✋', watch: '👁️', rebalance: '🔄',
  alert: '⚠️', opportunity: '💡', tax_action: '💸',
};
const URGENCY_COLORS: Record<string, string> = { high: C.error, medium: C.warning, low: C.primary };

const ASSET_TYPES: { key: AssetClass; label: string; emoji: string }[] = [
  { key: 'mutual_fund', label: 'Mutual Fund', emoji: '📊' },
  { key: 'stock', label: 'Stock', emoji: '📈' },
  { key: 'gold', label: 'Gold', emoji: '🥇' },
  { key: 'fd', label: 'FD', emoji: '🏦' },
  { key: 'ppf', label: 'PPF', emoji: '🔒' },
  { key: 'nps', label: 'NPS', emoji: '🏖️' },
  { key: 'real_estate', label: 'Real Estate', emoji: '🏠' },
  { key: 'crypto', label: 'Crypto', emoji: '₿' },
  { key: 'epf', label: 'EPF', emoji: '🏢' },
  { key: 'other', label: 'Other', emoji: '📦' },
];

export default function CompanionScreen({ navigation }: any) {
  const { user, investments, buckets, goals } = useUser();
  const [refreshing, setRefreshing] = useState(false);
  const [market, setMarket] = useState<MarketData | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [insurance, setInsurance] = useState<InsurancePolicy[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [lifeEvents, setLifeEvents] = useState<LifeEvent[]>([]);
  const [signals, setSignals] = useState<AISignal[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [brief, setBrief] = useState<DailyBrief | null>(null);
  const [activeTab, setActiveTab] = useState<'brief' | 'signals' | 'wealth' | 'assets' | 'watchlist'>('brief');

  // Add asset modal
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [assetName, setAssetName] = useState('');
  const [assetType, setAssetType] = useState<AssetClass>('mutual_fund');
  const [assetInvested, setAssetInvested] = useState('');
  const [assetCurrent, setAssetCurrent] = useState('');

  // Add watchlist modal
  const [showAddWatch, setShowAddWatch] = useState(false);
  const [watchSymbol, setWatchSymbol] = useState('');
  const [watchName, setWatchName] = useState('');
  const [watchBuyTarget, setWatchBuyTarget] = useState('');

  const loadAll = useCallback(async () => {
    const [m, a, l, ins, w, le, exp] = await Promise.all([
      getMarketData().catch(() => null),
      loadAssets(), loadLiabilities(), loadInsurance(),
      loadWatchlist(), loadLifeEvents(), loadExpenses(),
    ]);
    if (m) setMarket(m);
    setAssets(a); setLiabilities(l); setInsurance(ins);
    setWatchlist(w); setLifeEvents(le); setExpenses(exp);

    // Generate signals
    if (user && m) {
      const sigs = generateSignals(user, m, a, l, ins, w, investments, goals, buckets);
      setSignals(sigs);
      await saveSignals(sigs);

      // Generate daily brief
      const nw = calculateNetWorth(a, l, buckets);
      const db = generateDailyBrief(user, m, nw, sigs, investments, goals);
      setBrief(db);
    }
  }, [user, investments, goals, buckets]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const onRefresh = () => { setRefreshing(true); loadAll().then(() => setRefreshing(false)); };

  const netWorth = useMemo(() => calculateNetWorth(assets, liabilities, buckets), [assets, liabilities, buckets]);
  const taxProfile = useMemo(() => user ? calculateTaxProfile(user, assets, investments) : null, [user, assets, investments]);
  const analysis = useMemo(() => user ? analyzePortfolio(user, investments, buckets, goals) : null, [user, investments, buckets, goals]);

  const handleAddAsset = async () => {
    const inv = parseFloat(assetInvested) || 0;
    const cur = parseFloat(assetCurrent) || inv;
    if (!assetName || inv <= 0) return;
    await addAsset({
      name: assetName, type: assetType, investedAmount: inv, currentValue: cur,
      returns: cur - inv, returnPercent: inv > 0 ? ((cur - inv) / inv) * 100 : 0,
      purchaseDate: new Date().toISOString(), notes: '',
      riskLevel: ['fd', 'ppf', 'epf'].includes(assetType) ? 'safe' : ['stock', 'crypto'].includes(assetType) ? 'aggressive' : 'balanced',
      bucket: ['fd', 'ppf', 'epf', 'bonds'].includes(assetType) ? 'safe' : ['stock', 'crypto'].includes(assetType) ? 'opportunity' : 'growth',
    });
    setShowAddAsset(false); setAssetName(''); setAssetInvested(''); setAssetCurrent('');
    loadAll();
  };

  const handleAddWatch = async () => {
    if (!watchSymbol || !watchName) return;
    await addToWatchlist({
      symbol: watchSymbol.toUpperCase(), name: watchName, type: 'stock',
      currentPrice: 0, changePercent: 0,
      targetBuyPrice: parseFloat(watchBuyTarget) || undefined,
      notes: '',
    });
    setShowAddWatch(false); setWatchSymbol(''); setWatchName(''); setWatchBuyTarget('');
    loadAll();
  };

  const handleRemoveWatch = async (id: string) => {
    await removeFromWatchlist(id);
    loadAll();
  };

  if (!user) return null;

  const unreadSignals = signals.filter(s => !s.read).length;
  const tabs = [
    { key: 'brief', label: 'Daily Brief', emoji: '📰' },
    { key: 'signals', label: `Signals${unreadSignals > 0 ? ` (${unreadSignals})` : ''}`, emoji: '🎯' },
    { key: 'wealth', label: 'Net Worth', emoji: '💎' },
    { key: 'assets', label: 'Assets', emoji: '💼' },
    { key: 'watchlist', label: 'Watchlist', emoji: '👁️' },
  ];

  return (
    <View style={s.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={s.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={s.jarvisIcon}><Text style={{ fontSize: 18 }}>🤖</Text></View>
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={s.headerTitle}>Saathi Companion</Text>
            <Text style={s.headerSub}>Your AI investment Jarvis</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Saathi')} style={s.chatBtn}>
            <Text style={{ fontSize: 14 }}>✨ Ask AI</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabBar} contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}>
        {tabs.map(t => (
          <TouchableOpacity key={t.key} style={[s.tab, activeTab === t.key && s.tabActive]} onPress={() => setActiveTab(t.key as any)} activeOpacity={0.7}>
            <Text style={[s.tabText, activeTab === t.key && s.tabTextActive]}>{t.emoji} {t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.textMuted} />}
      >
        {/* ═══ DAILY BRIEF ═══ */}
        {activeTab === 'brief' && brief && (
          <>
            <View style={s.briefCard}>
              <Text style={s.briefGreeting}>{brief.greeting}</Text>
              <Text style={s.briefMotivation}>{brief.motivationalNote}</Text>
            </View>

            <View style={s.card}>
              <Text style={s.cardLabel}>MARKET SNAPSHOT</Text>
              <Text style={s.briefMarket}>{brief.marketSummary}</Text>
            </View>

            <View style={s.card}>
              <Text style={s.cardLabel}>YOUR PORTFOLIO</Text>
              <Text style={s.briefPortfolio}>{brief.portfolioUpdate}</Text>
              {analysis && (
                <View style={{ flexDirection: 'row', marginTop: 10, gap: 12 }}>
                  <View style={s.miniStat}>
                    <Text style={s.miniLabel}>Consistency</Text>
                    <Text style={s.miniValue}>{analysis.consistencyScore}/100</Text>
                  </View>
                  <View style={s.miniStat}>
                    <Text style={s.miniLabel}>Drift</Text>
                    <Text style={[s.miniValue, { color: analysis.allocationDrift > 20 ? C.warning : C.success }]}>{analysis.allocationDrift}%</Text>
                  </View>
                  <View style={s.miniStat}>
                    <Text style={s.miniLabel}>Risk</Text>
                    <Text style={[s.miniValue, { color: analysis.riskMismatch ? C.error : C.success }]}>{analysis.actualRisk}</Text>
                  </View>
                </View>
              )}
            </View>

            {brief.actionItems.length > 0 && (
              <View style={s.card}>
                <Text style={s.cardLabel}>ACTION ITEMS</Text>
                {brief.actionItems.map((a, i) => (
                  <View key={i} style={s.actionItem}>
                    <Text style={s.actionDot}>→</Text>
                    <Text style={s.actionText}>{a}</Text>
                  </View>
                ))}
              </View>
            )}

            {taxProfile && taxProfile.potentialSavings > 0 && (
              <View style={[s.card, { borderLeftWidth: 3, borderLeftColor: C.accent }]}>
                <Text style={s.cardLabel}>TAX OPTIMIZER</Text>
                <Text style={s.taxText}>80C: ₹{taxProfile.section80C.toLocaleString('en-IN')} / 1,50,000</Text>
                <View style={s.taxBar}>
                  <View style={[s.taxFill, { width: `${Math.min(100, (taxProfile.section80C / 150000) * 100)}%` }]} />
                </View>
                <Text style={s.taxSaving}>Saved: ~₹{taxProfile.totalTaxSaved.toLocaleString('en-IN')} | Can save ₹{taxProfile.potentialSavings.toLocaleString('en-IN')} more</Text>
              </View>
            )}
          </>
        )}

        {/* ═══ SIGNALS ═══ */}
        {activeTab === 'signals' && (
          <>
            {signals.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={{ fontSize: 36 }}>🎯</Text>
                <Text style={s.emptyText}>Add assets & watchlist items{'\n'}to get personalized signals</Text>
              </View>
            ) : (
              signals.map(sig => (
                <View key={sig.id} style={[s.signalCard, { borderLeftColor: URGENCY_COLORS[sig.urgency] }]}>
                  <View style={s.signalHeader}>
                    <Text style={{ fontSize: 16 }}>{SIGNAL_ICONS[sig.type] || '📌'}</Text>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={s.signalTitle}>{sig.title}</Text>
                      <Text style={[s.signalType, { color: URGENCY_COLORS[sig.urgency] }]}>{sig.type.toUpperCase()} • {sig.urgency}</Text>
                    </View>
                    <View style={[s.confBadge, { borderColor: URGENCY_COLORS[sig.urgency] }]}>
                      <Text style={[s.confText, { color: URGENCY_COLORS[sig.urgency] }]}>{sig.confidence}%</Text>
                    </View>
                  </View>
                  <Text style={s.signalDesc}>{sig.description}</Text>
                </View>
              ))
            )}
          </>
        )}

        {/* ═══ NET WORTH ═══ */}
        {activeTab === 'wealth' && (
          <>
            <View style={s.nwCard}>
              <Text style={s.nwLabel}>NET WORTH</Text>
              <Text style={s.nwValue}>{formatFullCurrency(netWorth.netWorth)}</Text>
              <View style={s.nwRow}>
                <View>
                  <Text style={s.nwSubLabel}>Assets</Text>
                  <Text style={[s.nwSubValue, { color: C.success }]}>{formatFullCurrency(netWorth.totalAssets)}</Text>
                </View>
                <View>
                  <Text style={s.nwSubLabel}>Liabilities</Text>
                  <Text style={[s.nwSubValue, { color: C.error }]}>{formatFullCurrency(netWorth.totalLiabilities)}</Text>
                </View>
              </View>
            </View>

            {netWorth.assetBreakdown.length > 0 && (
              <View style={s.card}>
                <Text style={s.cardLabel}>ASSET ALLOCATION</Text>
                {netWorth.assetBreakdown.map(a => {
                  const info = ASSET_TYPES.find(t => t.key === a.type);
                  return (
                    <View key={a.type} style={s.allocRow}>
                      <Text style={{ fontSize: 14, width: 22 }}>{info?.emoji || '📦'}</Text>
                      <Text style={s.allocLabel}>{info?.label || a.type}</Text>
                      <View style={s.allocBar}>
                        <View style={[s.allocFill, { width: `${Math.max(3, a.percent)}%` }]} />
                      </View>
                      <Text style={s.allocPct}>{a.percent}%</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {liabilities.length > 0 && (
              <View style={s.card}>
                <Text style={s.cardLabel}>LIABILITIES</Text>
                {liabilities.map(l => (
                  <View key={l.id} style={s.debtRow}>
                    <Text style={{ fontSize: 16 }}>{l.emoji}</Text>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={s.debtName}>{l.name}</Text>
                      <Text style={s.debtSub}>EMI ₹{l.emi.toLocaleString('en-IN')} @ {l.interestRate}%</Text>
                    </View>
                    <Text style={s.debtAmount}>₹{l.outstandingAmount.toLocaleString('en-IN')}</Text>
                  </View>
                ))}
              </View>
            )}

            {insurance.length > 0 && (
              <View style={s.card}>
                <Text style={s.cardLabel}>INSURANCE</Text>
                {insurance.map(p => (
                  <View key={p.id} style={s.debtRow}>
                    <Text style={{ fontSize: 16 }}>{p.emoji}</Text>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={s.debtName}>{p.name}</Text>
                      <Text style={s.debtSub}>Cover ₹{p.coverAmount.toLocaleString('en-IN')}</Text>
                    </View>
                    <Text style={s.debtAmount}>₹{p.premium.toLocaleString('en-IN')}/{p.premiumFrequency.slice(0, 2)}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* ═══ ASSETS ═══ */}
        {activeTab === 'assets' && (
          <>
            <TouchableOpacity style={s.addBtn} onPress={() => setShowAddAsset(true)}>
              <Text style={s.addBtnText}>+ Add Asset</Text>
            </TouchableOpacity>

            {assets.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={{ fontSize: 36 }}>💼</Text>
                <Text style={s.emptyText}>Add your MFs, stocks, gold, FDs{'\n'}for complete portfolio tracking</Text>
              </View>
            ) : (
              assets.map(a => {
                const info = ASSET_TYPES.find(t => t.key === a.type);
                const isPositive = a.returnPercent >= 0;
                return (
                  <View key={a.id} style={s.assetCard}>
                    <View style={s.assetHeader}>
                      <Text style={{ fontSize: 18 }}>{info?.emoji || '📦'}</Text>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={s.assetName}>{a.name}</Text>
                        <Text style={s.assetType}>{info?.label || a.type} • {a.riskLevel}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={s.assetValue}>{formatFullCurrency(a.currentValue)}</Text>
                        <Text style={[s.assetReturn, { color: isPositive ? C.success : C.error }]}>
                          {isPositive ? '+' : ''}{a.returnPercent.toFixed(1)}%
                        </Text>
                      </View>
                    </View>
                    <View style={s.assetFooter}>
                      <Text style={s.assetInv}>Invested: {formatFullCurrency(a.investedAmount)}</Text>
                      <Text style={[s.assetPnl, { color: isPositive ? C.success : C.error }]}>
                        P&L: {isPositive ? '+' : ''}{formatFullCurrency(a.returns)}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}

        {/* ═══ WATCHLIST ═══ */}
        {activeTab === 'watchlist' && (
          <>
            <TouchableOpacity style={s.addBtn} onPress={() => setShowAddWatch(true)}>
              <Text style={s.addBtnText}>+ Add to Watchlist</Text>
            </TouchableOpacity>

            {watchlist.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={{ fontSize: 36 }}>👁️</Text>
                <Text style={s.emptyText}>Watch stocks, MFs, ETFs{'\n'}Get alerts when they hit your target</Text>
              </View>
            ) : (
              watchlist.map(w => (
                <View key={w.id} style={s.watchCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.watchSymbol}>{w.symbol}</Text>
                    <Text style={s.watchName}>{w.name}</Text>
                    {w.targetBuyPrice && <Text style={s.watchTarget}>Buy target: ₹{w.targetBuyPrice}</Text>}
                    {w.targetSellPrice && <Text style={s.watchTarget}>Sell target: ₹{w.targetSellPrice}</Text>}
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveWatch(w.id)} style={s.removeBtn}>
                    <Text style={s.removeTxt}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}

            {/* Market overview */}
            {market && (
              <View style={s.card}>
                <Text style={s.cardLabel}>MARKET OVERVIEW</Text>
                {[
                  { name: 'Nifty 50', val: market.nifty50.value, chg: market.nifty50.changePercent },
                  { name: 'Sensex', val: market.sensex.value, chg: market.sensex.changePercent },
                  { name: `Gold /10g`, val: market.goldPrice, chg: 0 },
                  { name: 'FD Rate', val: market.fdRate, chg: 0, suffix: '%' },
                ].map((m, i) => (
                  <View key={i} style={s.mktRow}>
                    <Text style={s.mktName}>{m.name}</Text>
                    <Text style={s.mktVal}>{m.suffix ? `${m.val}${m.suffix}` : `₹${m.val.toLocaleString()}`}</Text>
                    {m.chg !== 0 && <Text style={[s.mktChg, { color: m.chg >= 0 ? C.success : C.error }]}>{m.chg >= 0 ? '+' : ''}{m.chg}%</Text>}
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ═══ ADD ASSET MODAL ═══ */}
      <Modal visible={showAddAsset} transparent animationType="slide">
        <View style={s.modalBg}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowAddAsset(false)} />
          <View style={s.modalSheet}>
            <View style={s.handle} />
            <ScrollView showsVerticalScrollIndicator={false} bounces={false} keyboardShouldPersistTaps="handled">
              <Text style={s.modalTitle}>Add Asset 💼</Text>

              <Text style={s.fLabel}>NAME</Text>
              <TextInput style={s.fInput} placeholder="HDFC Flexicap Fund" placeholderTextColor="#555" value={assetName} onChangeText={setAssetName} />

              <Text style={s.fLabel}>TYPE</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {ASSET_TYPES.map(t => (
                    <TouchableOpacity key={t.key} style={[s.chip, assetType === t.key && s.chipOn]} onPress={() => setAssetType(t.key)}>
                      <Text style={[s.chipTxt, assetType === t.key && s.chipTxtOn]}>{t.emoji} {t.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={s.fLabel}>INVESTED AMOUNT (₹)</Text>
              <TextInput style={s.fInput} placeholder="50000" placeholderTextColor="#555" value={assetInvested} onChangeText={setAssetInvested} keyboardType="numeric" />

              <Text style={s.fLabel}>CURRENT VALUE (₹)</Text>
              <TextInput style={s.fInput} placeholder="55000" placeholderTextColor="#555" value={assetCurrent} onChangeText={setAssetCurrent} keyboardType="numeric" />

              <View style={s.btnRow}>
                <TouchableOpacity style={s.btnSec} onPress={() => setShowAddAsset(false)}><Text style={s.btnSecTxt}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={s.btnPri} onPress={handleAddAsset}>
                  <LinearGradient colors={['#6C63FF', '#4F46E5']} style={s.btnGrad}><Text style={s.btnPriTxt}>Add Asset</Text></LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═══ ADD WATCHLIST MODAL ═══ */}
      <Modal visible={showAddWatch} transparent animationType="slide">
        <View style={s.modalBg}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowAddWatch(false)} />
          <View style={s.modalSheet}>
            <View style={s.handle} />
            <Text style={s.modalTitle}>Add to Watchlist 👁️</Text>

            <Text style={s.fLabel}>SYMBOL</Text>
            <TextInput style={s.fInput} placeholder="RELIANCE" placeholderTextColor="#555" value={watchSymbol} onChangeText={setWatchSymbol} autoCapitalize="characters" />

            <Text style={s.fLabel}>NAME</Text>
            <TextInput style={s.fInput} placeholder="Reliance Industries" placeholderTextColor="#555" value={watchName} onChangeText={setWatchName} />

            <Text style={s.fLabel}>BUY TARGET PRICE (₹) — optional</Text>
            <TextInput style={s.fInput} placeholder="2400" placeholderTextColor="#555" value={watchBuyTarget} onChangeText={setWatchBuyTarget} keyboardType="numeric" />

            <View style={s.btnRow}>
              <TouchableOpacity style={s.btnSec} onPress={() => setShowAddWatch(false)}><Text style={s.btnSecTxt}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={s.btnPri} onPress={handleAddWatch}>
                <LinearGradient colors={['#6C63FF', '#4F46E5']} style={s.btnGrad}><Text style={s.btnPriTxt}>Watch</Text></LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 12, paddingHorizontal: 20, backgroundColor: C.bg, borderBottomWidth: 1, borderBottomColor: C.border },
  jarvisIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.border },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  headerSub: { fontSize: 11, color: C.textMuted },
  chatBtn: { backgroundColor: C.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: C.border },
  tabBar: { maxHeight: 44, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.bg },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  tabActive: { backgroundColor: C.primary, borderColor: C.primary },
  tabText: { fontSize: 12, fontWeight: '600', color: C.textMuted },
  tabTextActive: { color: '#FFF' },
  body: { padding: 16 },

  // Cards
  card: { backgroundColor: C.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  cardLabel: { fontSize: 10, fontWeight: '700', color: C.textMuted, letterSpacing: 1, marginBottom: 8 },

  // Brief
  briefCard: { backgroundColor: C.surface, borderRadius: 14, padding: 18, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  briefGreeting: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 6 },
  briefMotivation: { fontSize: 12, color: C.textMuted, fontStyle: 'italic', lineHeight: 18 },
  briefMarket: { fontSize: 13, color: C.textSec, lineHeight: 19 },
  briefPortfolio: { fontSize: 13, color: C.textSec, lineHeight: 19 },
  miniStat: { flex: 1, backgroundColor: C.input, borderRadius: 10, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  miniLabel: { fontSize: 9, color: C.textMuted },
  miniValue: { fontSize: 14, fontWeight: '800', color: C.text, marginTop: 2 },
  actionItem: { flexDirection: 'row', paddingVertical: 6, alignItems: 'flex-start' },
  actionDot: { color: C.primary, fontWeight: '700', marginRight: 8, fontSize: 13 },
  actionText: { fontSize: 13, color: C.textSec, flex: 1, lineHeight: 18 },

  // Tax
  taxText: { fontSize: 13, color: C.textSec },
  taxBar: { height: 5, backgroundColor: C.input, borderRadius: 3, overflow: 'hidden', marginVertical: 6 },
  taxFill: { height: '100%', backgroundColor: C.accent, borderRadius: 3 },
  taxSaving: { fontSize: 11, color: C.textMuted },

  // Signals
  signalCard: { backgroundColor: C.surface, borderRadius: 12, padding: 14, marginBottom: 8, borderLeftWidth: 3, borderWidth: 1, borderColor: C.border },
  signalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  signalTitle: { fontSize: 13, fontWeight: '700', color: C.text },
  signalType: { fontSize: 10, fontWeight: '600', marginTop: 1 },
  signalDesc: { fontSize: 12, color: C.textMuted, lineHeight: 17 },
  confBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  confText: { fontSize: 10, fontWeight: '700' },

  // Net Worth
  nwCard: { backgroundColor: C.surface, borderRadius: 16, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  nwLabel: { fontSize: 10, color: C.textMuted, letterSpacing: 1 },
  nwValue: { fontSize: 30, fontWeight: '800', color: C.text, marginTop: 4 },
  nwRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
  nwSubLabel: { fontSize: 10, color: C.textMuted },
  nwSubValue: { fontSize: 16, fontWeight: '700', marginTop: 2 },
  allocRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  allocLabel: { fontSize: 12, color: C.textSec, flex: 1, marginLeft: 6 },
  allocBar: { width: 60, height: 5, backgroundColor: C.input, borderRadius: 3, overflow: 'hidden', marginRight: 8 },
  allocFill: { height: '100%', backgroundColor: C.primary, borderRadius: 3 },
  allocPct: { fontSize: 12, fontWeight: '700', color: C.text, width: 30, textAlign: 'right' },
  debtRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  debtName: { fontSize: 13, fontWeight: '600', color: C.text },
  debtSub: { fontSize: 10, color: C.textMuted, marginTop: 1 },
  debtAmount: { fontSize: 13, fontWeight: '700', color: C.text },

  // Assets
  addBtn: { backgroundColor: C.surface, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: C.border, borderStyle: 'dashed' },
  addBtnText: { fontSize: 13, fontWeight: '600', color: C.primary },
  assetCard: { backgroundColor: C.surface, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: C.border },
  assetHeader: { flexDirection: 'row', alignItems: 'center' },
  assetName: { fontSize: 14, fontWeight: '700', color: C.text },
  assetType: { fontSize: 10, color: C.textMuted, marginTop: 1 },
  assetValue: { fontSize: 15, fontWeight: '800', color: C.text },
  assetReturn: { fontSize: 11, fontWeight: '700', marginTop: 1 },
  assetFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border },
  assetInv: { fontSize: 11, color: C.textMuted },
  assetPnl: { fontSize: 11, fontWeight: '700' },

  // Watchlist
  watchCard: { backgroundColor: C.surface, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center' },
  watchSymbol: { fontSize: 14, fontWeight: '800', color: C.text },
  watchName: { fontSize: 11, color: C.textMuted, marginTop: 1 },
  watchTarget: { fontSize: 10, color: C.success, marginTop: 2 },
  removeBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: C.input, justifyContent: 'center', alignItems: 'center' },
  removeTxt: { fontSize: 12, color: C.textMuted },
  mktRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.border },
  mktName: { flex: 1, fontSize: 13, color: C.textSec },
  mktVal: { fontSize: 13, fontWeight: '700', color: C.text, marginRight: 8 },
  mktChg: { fontSize: 11, fontWeight: '600', width: 45, textAlign: 'right' },

  // Empty
  emptyCard: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 13, color: C.textMuted, textAlign: 'center', lineHeight: 19, marginTop: 8 },

  // Modals
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet: { backgroundColor: C.elevated, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: Platform.OS === 'ios' ? 40 : 22, maxHeight: '80%' },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#333', alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 16 },
  fLabel: { fontSize: 10, fontWeight: '600', color: C.textMuted, marginBottom: 6, letterSpacing: 1 },
  fInput: { backgroundColor: C.input, borderRadius: 12, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 13 : 10, fontSize: 16, fontWeight: '600', color: C.text, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: C.input, borderWidth: 1, borderColor: C.border },
  chipOn: { backgroundColor: C.primary, borderColor: C.primary },
  chipTxt: { fontSize: 11, fontWeight: '600', color: C.textMuted },
  chipTxtOn: { color: '#FFF' },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btnSec: { flex: 1, paddingVertical: 13, alignItems: 'center', borderRadius: 12, backgroundColor: C.input, borderWidth: 1, borderColor: C.border },
  btnSecTxt: { fontSize: 14, fontWeight: '600', color: C.textSec },
  btnPri: { flex: 2, borderRadius: 12, overflow: 'hidden' },
  btnGrad: { paddingVertical: 13, alignItems: 'center', borderRadius: 12 },
  btnPriTxt: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});

