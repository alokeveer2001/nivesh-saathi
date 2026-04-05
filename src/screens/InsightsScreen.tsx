import React, { useMemo, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useUser } from '../context/UserContext';
import { analyzePortfolio } from '../services/portfolioAnalyzer';
import { loadExpenses, analyzeExpenses, Expense, ExpenseAnalysis, EXPENSE_CATEGORIES } from '../services/expenseIntelligence';
import { getMarketData, MarketData } from '../services/marketIntelligence';
import { formatFullCurrency } from '../utils/helpers';
import { Insight, InsightSeverity, PortfolioAnalysis } from '../types';

const { width } = Dimensions.get('window');

const SEVERITY_CONFIG: Record<InsightSeverity, { bg: string; border: string; icon: string; color: string }> = {
  critical: { bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)', icon: '🚨', color: '#F87171' },
  warning: { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)', icon: '⚠️', color: '#FBBF24' },
  info: { bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.2)', icon: '💡', color: '#60A5FA' },
  positive: { bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.2)', icon: '✅', color: '#34D399' },
};

export default function InsightsScreen({ navigation }: any) {
  const { user, investments, buckets, goals } = useUser();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [market, setMarket] = useState<MarketData | null>(null);

  useEffect(() => {
    loadExpenses().then(setExpenses);
    getMarketData().then(setMarket).catch(() => {});
  }, []);

  const analysis: PortfolioAnalysis | null = useMemo(() => {
    if (!user) return null;
    return analyzePortfolio(user, investments, buckets, goals);
  }, [user, investments, buckets, goals]);

  const expenseAnalysis: ExpenseAnalysis | null = useMemo(() => {
    if (!user) return null;
    return analyzeExpenses(expenses, user, investments);
  }, [expenses, user, investments]);

  if (!user || !analysis) return null;

  const totalInvested = buckets.reduce((s, b) => s + b.currentAmount, 0);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Insights 🧠</Text>
        <Text style={styles.headerSub}>Data-driven portfolio intelligence</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Portfolio Health Score */}
        <View style={styles.healthCard}>
          <View style={styles.healthRow}>
            <View style={styles.healthScore}>
              <Text style={styles.healthNumber}>{analysis.consistencyScore}</Text>
              <Text style={styles.healthLabel}>Consistency{'\n'}Score</Text>
            </View>
            <View style={styles.healthDivider} />
            <View style={styles.healthScore}>
              <Text style={[styles.healthNumber, { color: analysis.allocationDrift > 20 ? '#D97706' : '#10B981' }]}>
                {100 - analysis.allocationDrift}
              </Text>
              <Text style={styles.healthLabel}>Allocation{'\n'}Health</Text>
            </View>
            <View style={styles.healthDivider} />
            <View style={styles.healthScore}>
              <Text style={styles.healthNumber}>{investments.length}</Text>
              <Text style={styles.healthLabel}>Total{'\n'}Investments</Text>
            </View>
          </View>
        </View>

        {/* Allocation Comparison */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Allocation: Target vs Actual</Text>
          {investments.length === 0 ? (
            <Text style={styles.emptyText}>Start investing to see your allocation analysis</Text>
          ) : (
            <View>
              {(['safe', 'growth', 'opportunity'] as const).map(bucket => {
                const actual = analysis.actualAllocation[bucket];
                const target = analysis.targetAllocation[bucket];
                const diff = actual - target;
                const label = { safe: '🟢 Safe', growth: '🟡 Growth', opportunity: '🔴 Opportunity' }[bucket];
                return (
                  <View key={bucket} style={styles.allocRow}>
                    <Text style={styles.allocLabel}>{label}</Text>
                    <View style={styles.allocBars}>
                      <View style={styles.allocBarBg}>
                        <View style={[styles.allocBarTarget, { width: `${target}%` }]} />
                        <View style={[styles.allocBarActual, {
                          width: `${actual}%`,
                          backgroundColor: Math.abs(diff) > 15 ? '#D97706' : '#10B981',
                        }]} />
                      </View>
                    </View>
                    <View style={styles.allocNumbers}>
                      <Text style={styles.allocActual}>{actual}%</Text>
                      <Text style={styles.allocTarget}>({target}%)</Text>
                    </View>
                  </View>
                );
              })}
              {analysis.allocationDrift > 15 && (
                <View style={styles.driftBadge}>
                  <Text style={styles.driftText}>
                    ⚠️ {analysis.allocationDrift}% drift from target — rebalancing needed
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Risk Analysis */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Risk Analysis</Text>
          <View style={styles.riskRow}>
            <View style={styles.riskItem}>
              <Text style={styles.riskLabel}>Stated</Text>
              <View style={[styles.riskBadge, { backgroundColor: riskColor(analysis.statedRisk) }]}>
                <Text style={styles.riskBadgeText}>{analysis.statedRisk}</Text>
              </View>
            </View>
            <Text style={styles.riskArrow}>→</Text>
            <View style={styles.riskItem}>
              <Text style={styles.riskLabel}>Actual</Text>
              <View style={[styles.riskBadge, { backgroundColor: riskColor(analysis.actualRisk) }]}>
                <Text style={styles.riskBadgeText}>{analysis.actualRisk}</Text>
              </View>
            </View>
            <View style={styles.riskItem}>
              <Text style={styles.riskLabel}>Match</Text>
              <Text style={[styles.riskMatch, { color: analysis.riskMismatch ? '#DC2626' : '#10B981' }]}>
                {analysis.riskMismatch ? '❌ Mismatch' : '✅ Aligned'}
              </Text>
            </View>
          </View>
          {analysis.riskMismatch && investments.length >= 3 && (
            <Text style={styles.riskNote}>
              Aapki actual investing pattern aapke stated risk se different hai. Yeh intentional hai ya adjust karna chahte ho?
            </Text>
          )}
        </View>

        {/* Goal Health */}
        {analysis.goalHealthScores.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Goal Health</Text>
            {analysis.goalHealthScores.map(g => (
              <View key={g.goalId} style={styles.goalRow}>
                <Text style={styles.goalEmoji}>{g.emoji}</Text>
                <View style={styles.goalInfo}>
                  <Text style={styles.goalName}>{g.name}</Text>
                  <View style={styles.goalBar}>
                    <View style={[styles.goalBarFill, {
                      width: `${Math.max(3, g.health)}%`,
                      backgroundColor: g.onTrack ? '#10B981' : '#D97706',
                    }]} />
                  </View>
                </View>
                <View style={styles.goalStatus}>
                  <Text style={styles.goalPercent}>{g.health}%</Text>
                  <Text style={[styles.goalTrack, { color: g.onTrack ? '#10B981' : '#D97706' }]}>
                    {g.onTrack ? 'On Track' : `${g.monthsBehind}mo behind`}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Monthly Trend */}
        {analysis.monthlyTrend.length >= 2 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Monthly Trend</Text>
            <View style={styles.trendRow}>
              {analysis.monthlyTrend.slice(-6).map((m, i) => {
                const maxAmt = Math.max(...analysis.monthlyTrend.slice(-6).map(t => t.totalInvested), 1);
                const height = Math.max(8, (m.totalInvested / maxAmt) * 80);
                return (
                  <View key={m.month} style={styles.trendCol}>
                    <Text style={styles.trendAmount}>{formatFullCurrency(m.totalInvested)}</Text>
                    <View style={[styles.trendBar, { height }]}>
                      <LinearGradient colors={['#3F51B5', '#1A1F71']} style={styles.trendBarFill} />
                    </View>
                    <Text style={styles.trendMonth}>{m.month.slice(5)}</Text>
                  </View>
                );
              })}
            </View>
            <Text style={[styles.trendLabel, { color: analysis.isInvestingGrowing ? '#10B981' : '#D97706' }]}>
              {analysis.isInvestingGrowing ? '📈 Amount growing — great trend!' : '📉 Consider increasing monthly investments'}
            </Text>
          </View>
        )}

        {/* AI Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            AI Insights ({analysis.insights.length})
          </Text>
          {analysis.insights.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>🎯</Text>
              <Text style={styles.emptyText}>
                Start recording investments to get{'\n'}personalized AI insights!
              </Text>
            </View>
          ) : (
            analysis.insights.map(insight => (
              <InsightCard
                key={insight.id}
                insight={insight}
                onAction={() => {
                  if (insight.actionRoute) {
                    navigation.navigate(insight.actionRoute);
                  }
                }}
              />
            ))
          )}
        </View>

        {/* Expense Intelligence */}
        {expenseAnalysis && expenses.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Expense Intelligence 💸</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <View>
                <Text style={{ fontSize: 10, color: '#6B7280' }}>Spent This Month</Text>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#F0F0F5' }}>₹{expenseAnalysis.totalThisMonth.toLocaleString('en-IN')}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 10, color: '#6B7280' }}>Budget Used</Text>
                <Text style={{ fontSize: 18, fontWeight: '800', color: expenseAnalysis.budgetUsed > 80 ? '#F87171' : '#F0F0F5' }}>{expenseAnalysis.budgetUsed}%</Text>
              </View>
            </View>
            {expenseAnalysis.categoryBreakdown.slice(0, 4).map(c => {
              const info = EXPENSE_CATEGORIES.find(cat => cat.key === c.category);
              return (
                <View key={c.category} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ fontSize: 14, width: 24 }}>{info?.emoji}</Text>
                  <Text style={{ flex: 1, fontSize: 12, color: '#9CA3AF' }}>{info?.label}</Text>
                  <View style={{ width: 80, height: 5, backgroundColor: '#1E1E28', borderRadius: 3, overflow: 'hidden', marginRight: 8 }}>
                    <View style={{ width: `${c.percent}%`, height: '100%', backgroundColor: '#6C63FF', borderRadius: 3 }} />
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#F0F0F5', width: 50, textAlign: 'right' }}>₹{c.amount.toLocaleString('en-IN')}</Text>
                </View>
              );
            })}
            {expenseAnalysis.warnings.filter(w => w.severity !== 'info').map(w => (
              <View key={w.id} style={{ backgroundColor: w.severity === 'positive' ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.1)', borderRadius: 8, padding: 8, marginTop: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: w.severity === 'positive' ? '#34D399' : '#FBBF24' }}>{w.title}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Market Signals */}
        {market && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Market Signals 📡</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 10, color: '#6B7280' }}>Nifty 50</Text>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#F0F0F5' }}>{market.nifty50.value.toLocaleString()}</Text>
                <Text style={{ fontSize: 11, fontWeight: '600', color: market.nifty50.changePercent >= 0 ? '#34D399' : '#F87171' }}>
                  {market.nifty50.changePercent >= 0 ? '+' : ''}{market.nifty50.changePercent}%
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 10, color: '#6B7280' }}>Sentiment</Text>
                <Text style={{ fontSize: 22 }}>{market.marketSentiment === 'fear' ? '😰' : market.marketSentiment === 'greed' ? '🤑' : '😐'}</Text>
                <Text style={{ fontSize: 10, color: '#6B7280', textTransform: 'capitalize' }}>{market.marketSentiment}</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 10, color: '#6B7280' }}>Real FD Return</Text>
                <Text style={{ fontSize: 16, fontWeight: '800', color: (market.fdRate - market.inflation) > 0 ? '#34D399' : '#F87171' }}>
                  {(market.fdRate - market.inflation).toFixed(1)}%
                </Text>
                <Text style={{ fontSize: 10, color: '#6B7280' }}>after inflation</Text>
              </View>
            </View>
            {market.sectorHighlights.map((s, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4 }}>
                <Text style={{ fontSize: 14, marginRight: 8 }}>
                  {s.trend === 'bullish' ? '📈' : s.trend === 'bearish' ? '📉' : '➡️'}
                </Text>
                <Text style={{ fontSize: 12, color: '#9CA3AF', flex: 1 }}>
                  <Text style={{ fontWeight: '700' }}>{s.name}</Text>: {s.note}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Ask AI */}
        <TouchableOpacity
          style={styles.askAI}
          onPress={() => navigation.navigate('Saathi')}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['#6C63FF', '#4F46E5']} style={styles.askAIGradient}>
            <Text style={styles.askAIEmoji}>✨</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.askAITitle}>Ask Saathi AI</Text>
              <Text style={styles.askAISub}>Get personalized advice based on your data</Text>
            </View>
            <Text style={styles.askAIArrow}>→</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function InsightCard({ insight, onAction }: { insight: Insight; onAction: () => void }) {
  const config = SEVERITY_CONFIG[insight.severity];
  return (
    <View style={[styles.insightCard, { backgroundColor: config.bg, borderColor: config.border }]}>
      <View style={styles.insightHeader}>
        <Text style={styles.insightIcon}>{config.icon}</Text>
        <Text style={[styles.insightTitle, { color: config.color }]}>{insight.title}</Text>
      </View>
      <Text style={styles.insightDesc}>{insight.description}</Text>
      {insight.actionLabel && (
        <TouchableOpacity style={styles.insightAction} onPress={onAction}>
          <Text style={[styles.insightActionText, { color: config.color }]}>
            {insight.actionLabel} →
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function riskColor(risk: string) {
  return risk === 'aggressive' ? '#DC2626' : risk === 'balanced' ? '#D97706' : '#10B981';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B0F' },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 20, paddingHorizontal: 20, backgroundColor: '#0B0B0F',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#F0F0F5', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  content: { padding: 18 },
  healthCard: {
    backgroundColor: '#111118', borderRadius: 16, padding: 20, marginBottom: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  healthRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  healthScore: { alignItems: 'center' },
  healthNumber: { fontSize: 28, fontWeight: '800', color: '#F0F0F5' },
  healthLabel: { fontSize: 11, color: '#6B7280', textAlign: 'center', marginTop: 4 },
  healthDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.06)' },
  card: {
    backgroundColor: '#111118', borderRadius: 16, padding: 18, marginBottom: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#F0F0F5', marginBottom: 14 },
  allocRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  allocLabel: { width: 90, fontSize: 13, fontWeight: '600', color: '#9CA3AF' },
  allocBars: { flex: 1, marginHorizontal: 8 },
  allocBarBg: { height: 8, backgroundColor: '#1E1E28', borderRadius: 4, overflow: 'hidden', position: 'relative' },
  allocBarTarget: { position: 'absolute', height: '100%', backgroundColor: '#2A2A35', borderRadius: 4 },
  allocBarActual: { position: 'absolute', height: '100%', borderRadius: 4 },
  allocNumbers: { width: 60, flexDirection: 'row', alignItems: 'baseline' },
  allocActual: { fontSize: 14, fontWeight: '700', color: '#F0F0F5' },
  allocTarget: { fontSize: 10, color: '#6B7280', marginLeft: 3 },
  driftBadge: { backgroundColor: 'rgba(251,191,36,0.1)', borderRadius: 10, padding: 10, marginTop: 4 },
  driftText: { fontSize: 12, color: '#FBBF24' },
  riskRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  riskItem: { alignItems: 'center' },
  riskLabel: { fontSize: 11, color: '#6B7280', marginBottom: 6 },
  riskBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
  riskBadgeText: { fontSize: 12, fontWeight: '700', color: '#FFF', textTransform: 'capitalize' },
  riskArrow: { fontSize: 18, color: '#333' },
  riskMatch: { fontSize: 12, fontWeight: '700', marginTop: 6 },
  riskNote: { fontSize: 12, color: '#6B7280', marginTop: 12, lineHeight: 18 },
  goalRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  goalEmoji: { fontSize: 22, marginRight: 10 },
  goalInfo: { flex: 1 },
  goalName: { fontSize: 13, fontWeight: '600', color: '#9CA3AF', marginBottom: 4 },
  goalBar: { height: 6, backgroundColor: '#1E1E28', borderRadius: 3, overflow: 'hidden' },
  goalBarFill: { height: '100%', borderRadius: 3 },
  goalStatus: { alignItems: 'flex-end', marginLeft: 10 },
  goalPercent: { fontSize: 14, fontWeight: '800', color: '#F0F0F5' },
  goalTrack: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  trendRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 110 },
  trendCol: { alignItems: 'center', flex: 1 },
  trendAmount: { fontSize: 9, color: '#6B7280', marginBottom: 4 },
  trendBar: { width: 24, borderRadius: 6, overflow: 'hidden' },
  trendBarFill: { flex: 1, borderRadius: 6 },
  trendMonth: { fontSize: 10, color: '#6B7280', marginTop: 4 },
  trendLabel: { fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 10 },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#F0F0F5', marginBottom: 12, letterSpacing: -0.3 },
  insightCard: {
    borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1,
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  insightIcon: { fontSize: 16, marginRight: 8 },
  insightTitle: { fontSize: 14, fontWeight: '700', flex: 1 },
  insightDesc: { fontSize: 13, color: '#9CA3AF', lineHeight: 19 },
  insightAction: { marginTop: 8 },
  insightActionText: { fontSize: 13, fontWeight: '700' },
  emptyCard: { alignItems: 'center', paddingVertical: 30 },
  emptyEmoji: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 19 },
  askAI: { borderRadius: 16, overflow: 'hidden', marginTop: 4 },
  askAIGradient: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 16 },
  askAIEmoji: { fontSize: 24, marginRight: 12 },
  askAITitle: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  askAISub: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  askAIArrow: { fontSize: 20, color: 'rgba(255,255,255,0.4)', marginLeft: 8 },
});

