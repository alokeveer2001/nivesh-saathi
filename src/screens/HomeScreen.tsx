import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, RefreshControl, Platform, Modal, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/colors';
import { useUser } from '../context/UserContext';
import MoneyBucketCard from '../components/MoneyBucketCard';
import GoalCard from '../components/GoalCard';
import MoneyGarden from '../components/MoneyGarden';
import { formatFullCurrency, getGreeting, calculateFutureValue, parseAmount } from '../utils/helpers';
import { getDailyNudge } from '../services/aiService';
import { analyzePortfolio } from '../services/portfolioAnalyzer';
import { InsightSeverity } from '../types';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
  const { user, buckets, goals, investableAmount, investments, recordInvestment, totalInvested } = useUser();
  const [refreshing, setRefreshing] = useState(false);
  const [nudge, setNudge] = useState('');

  // Investment modal state
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [investBucket, setInvestBucket] = useState<'safe' | 'growth' | 'opportunity'>('growth');
  const [investAmount, setInvestAmount] = useState('');
  const [investNote, setInvestNote] = useState('');
  const [investGoalId, setInvestGoalId] = useState<string | undefined>(undefined);

  useEffect(() => {
    setNudge(getDailyNudge(user));
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setNudge(getDailyNudge(user));
    setTimeout(() => setRefreshing(false), 800);
  };

  const totalWealth = buckets.reduce((sum, b) => sum + b.currentAmount, 0);
  const futureValue5y = calculateFutureValue(investableAmount, 12, 5);
  const futureValue10y = calculateFutureValue(investableAmount, 12, 10);

  // Portfolio analysis — compute top alerts
  const analysis = useMemo(() => {
    if (!user) return null;
    return analyzePortfolio(user, investments, buckets, goals);
  }, [user, investments, buckets, goals]);

  const topAlerts = analysis?.insights.filter(i => i.severity === 'critical' || i.severity === 'warning').slice(0, 2) || [];

  const openInvestModal = (bucketId: 'safe' | 'growth' | 'opportunity') => {
    setInvestBucket(bucketId);
    setInvestAmount('');
    setInvestNote('');
    setInvestGoalId(undefined);
    setShowInvestModal(true);
  };

  const handleRecordInvestment = () => {
    const amount = parseAmount(investAmount);
    if (amount <= 0) return;
    recordInvestment(amount, investBucket, investGoalId, investNote);
    setShowInvestModal(false);
    setInvestAmount('');
    setInvestNote('');
  };

  const bucketGoals = goals.filter(g => g.bucket === investBucket);
  const recentInvestments = investments.slice(0, 5);

  if (!user) return null;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFF" />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={['#0F0F1E', '#1A1F71', '#2A3190']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>{getGreeting(user.name)}</Text>
              <Text style={styles.tagline}>Let's grow your wealth today</Text>
            </View>
            <TouchableOpacity
              style={styles.profileIcon}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={styles.profileText}>{user.name.charAt(0).toUpperCase()}</Text>
            </TouchableOpacity>
          </View>

          {/* Wealth Card */}
          <View style={styles.wealthCard}>
            <View style={styles.wealthRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.wealthLabel}>Total Invested</Text>
                <Text style={styles.wealthAmount}>{formatFullCurrency(totalWealth)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={styles.wealthLabel}>Monthly Investable</Text>
                <Text style={styles.wealthAmount}>{formatFullCurrency(investableAmount)}</Text>
              </View>
            </View>

            <View style={styles.projectionRow}>
              <View style={styles.projectionItem}>
                <Text style={styles.projectionLabel}>5Y Projection</Text>
                <Text style={styles.projectionValue}>{formatFullCurrency(futureValue5y)}</Text>
              </View>
              <Text style={styles.projectionArrow}>→</Text>
              <View style={styles.projectionItem}>
                <Text style={styles.projectionLabel}>10Y Projection</Text>
                <Text style={styles.projectionValue}>{formatFullCurrency(futureValue10y)}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* AI Nudge */}
          <TouchableOpacity
            style={styles.nudgeCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Saathi')}
          >
            <View style={styles.nudgeHeader}>
              <View style={styles.nudgeDot} />
              <Text style={styles.nudgeTitle}>AI INSIGHT</Text>
            </View>
            <Text style={styles.nudgeText}>{nudge}</Text>
            <Text style={styles.nudgeAction}>Chat with Saathi →</Text>
          </TouchableOpacity>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Saathi')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#EEF0FF' }]}>
                <Text style={styles.actionEmoji}>✨</Text>
              </View>
              <Text style={styles.actionLabel}>Ask AI</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('SIPCalculator')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
                <Text style={styles.actionEmoji}>📊</Text>
              </View>
              <Text style={styles.actionLabel}>SIP Calc</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Learn')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#F3E8FF' }]}>
                <Text style={styles.actionEmoji}>📚</Text>
              </View>
              <Text style={styles.actionLabel}>Learn</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Garden')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#F0FDF4' }]}>
                <Text style={styles.actionEmoji}>🌱</Text>
              </View>
              <Text style={styles.actionLabel}>Garden</Text>
            </TouchableOpacity>
          </View>

          {/* AI Alerts */}
          {topAlerts.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>AI Alerts</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Insights')}>
                  <Text style={styles.viewAll}>All insights →</Text>
                </TouchableOpacity>
              </View>
              {topAlerts.map(alert => {
                const isCritical = alert.severity === 'critical';
                return (
                  <View key={alert.id} style={[styles.alertCard, { borderLeftColor: isCritical ? '#DC2626' : '#D97706' }]}>
                    <Text style={styles.alertTitle}>{alert.title}</Text>
                    <Text style={styles.alertDesc}>{alert.description}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Money Buckets */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Money Buckets</Text>
            <Text style={styles.sectionSubtitle}>Tap "+ Record Investment" to track your investments</Text>
            {buckets.map(bucket => (
              <MoneyBucketCard
                key={bucket.id}
                bucket={bucket}
                investableAmount={investableAmount}
                onInvest={() => openInvestModal(bucket.id)}
              />
            ))}
          </View>

          {/* Recent Activity */}
          {recentInvestments.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <Text style={styles.sectionSubtitle}>{investments.length} total investments</Text>
              {recentInvestments.map(inv => {
                const bucketName = inv.bucket === 'safe' ? '🟢 Safe' : inv.bucket === 'growth' ? '🟡 Growth' : '🔴 Opportunity';
                const goal = inv.goalId ? goals.find(g => g.id === inv.goalId) : null;
                const date = new Date(inv.date);
                const dateStr = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
                return (
                  <View key={inv.id} style={styles.activityItem}>
                    <View style={styles.activityLeft}>
                      <Text style={styles.activityBucket}>{bucketName}</Text>
                      <Text style={styles.activityNote}>
                        {inv.note || (goal ? goal.emoji + ' ' + goal.name : 'General investment')}
                      </Text>
                    </View>
                    <View style={styles.activityRight}>
                      <Text style={styles.activityAmount}>+{formatFullCurrency(inv.amount)}</Text>
                      <Text style={styles.activityDate}>{dateStr}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Money Garden */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Money Garden 🌱</Text>
            <Text style={styles.sectionSubtitle}>Watch your investments grow</Text>
            <MoneyGarden />
          </View>

          {/* Goals */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Goals</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Goals')}>
                <Text style={styles.viewAll}>View all →</Text>
              </TouchableOpacity>
            </View>
            {goals.slice(0, 2).map(goal => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </View>

          <View style={{ height: 30 }} />
        </View>
      </ScrollView>

      {/* Record Investment Modal */}
      <Modal visible={showInvestModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Record Investment 💰</Text>
            <Text style={styles.modalSubtitle}>
              {investBucket === 'safe' ? '🟢 Safe Pocket' : investBucket === 'growth' ? '🟡 Growth Pocket' : '🔴 Opportunity Pocket'}
            </Text>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Amount (₹)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 5000"
                placeholderTextColor="#9CA3AF"
                value={investAmount}
                onChangeText={setInvestAmount}
                keyboardType="numeric"
                autoFocus
              />
            </View>

            {/* Link to goal */}
            {bucketGoals.length > 0 && (
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Link to Goal (optional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.goalChipRow}>
                    <TouchableOpacity
                      style={[styles.goalChip, !investGoalId && styles.goalChipActive]}
                      onPress={() => setInvestGoalId(undefined)}
                    >
                      <Text style={[styles.goalChipText, !investGoalId && styles.goalChipTextActive]}>None</Text>
                    </TouchableOpacity>
                    {bucketGoals.map(g => (
                      <TouchableOpacity
                        key={g.id}
                        style={[styles.goalChip, investGoalId === g.id && styles.goalChipActive]}
                        onPress={() => setInvestGoalId(g.id)}
                      >
                        <Text style={[styles.goalChipText, investGoalId === g.id && styles.goalChipTextActive]}>
                          {g.emoji} {g.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Note (optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Monthly SIP"
                placeholderTextColor="#9CA3AF"
                value={investNote}
                onChangeText={setInvestNote}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowInvestModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleRecordInvestment}>
                <LinearGradient colors={['#1A1F71', '#3F51B5']} style={styles.modalSaveGradient}>
                  <Text style={styles.modalSaveText}>Record ✅</Text>
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
  container: { flex: 1, backgroundColor: '#FAFBFF' },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 75,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 20, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3,
  },
  tagline: {
    fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 3,
  },
  profileIcon: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  profileText: {
    fontSize: 16, fontWeight: '800', color: '#FFFFFF',
  },
  wealthCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18, padding: 18, marginTop: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  wealthRow: { flexDirection: 'row', alignItems: 'center' },
  wealthLabel: {
    fontSize: 11, color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  wealthAmount: {
    fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginTop: 4,
  },
  divider: {
    width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 16,
  },
  projectionRow: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginTop: 14, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
  },
  projectionItem: { alignItems: 'center' },
  projectionLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)' },
  projectionValue: { fontSize: 15, fontWeight: '700', color: '#81C784', marginTop: 2 },
  projectionArrow: { fontSize: 16, color: 'rgba(255,255,255,0.3)', marginHorizontal: 18 },
  content: { marginTop: -48, paddingHorizontal: 18 },
  nudgeCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 3,
    borderLeftWidth: 3, borderLeftColor: '#FF9933',
  },
  nudgeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  nudgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF9933', marginRight: 8 },
  nudgeTitle: {
    fontSize: 11, fontWeight: '700', color: '#FF9933',
    textTransform: 'uppercase', letterSpacing: 1,
  },
  nudgeText: { fontSize: 14, color: '#374151', lineHeight: 21 },
  nudgeAction: { fontSize: 13, color: '#1A1F71', fontWeight: '600', marginTop: 10 },
  quickActions: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20,
  },
  actionButton: { width: (width - 60) / 4, alignItems: 'center' },
  actionIcon: {
    width: 48, height: 48, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  actionEmoji: { fontSize: 22 },
  actionLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280' },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: {
    fontSize: 18, fontWeight: '800', color: '#1A1A2E', marginBottom: 4, letterSpacing: -0.3,
  },
  sectionSubtitle: { fontSize: 12, color: '#9CA3AF', marginBottom: 12 },
  viewAll: { fontSize: 13, color: '#1A1F71', fontWeight: '600' },

  // Alerts
  alertCard: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginBottom: 8,
    borderLeftWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  alertTitle: { fontSize: 13, fontWeight: '700', color: '#1A1A2E', marginBottom: 4 },
  alertDesc: { fontSize: 12, color: '#6B7280', lineHeight: 17 },

  // Activity
  activityItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  activityLeft: { flex: 1 },
  activityBucket: { fontSize: 13, fontWeight: '600', color: '#374151' },
  activityNote: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  activityRight: { alignItems: 'flex-end' },
  activityAmount: { fontSize: 15, fontWeight: '700', color: '#10B981' },
  activityDate: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A2E' },
  modalSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4, marginBottom: 16 },
  modalField: { marginBottom: 14 },
  modalLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 6 },
  modalInput: {
    backgroundColor: '#F5F5FA', borderRadius: 12, paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 16, fontWeight: '600', color: '#1A1A2E',
  },
  goalChipRow: { flexDirection: 'row', gap: 8 },
  goalChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    backgroundColor: '#F5F5FA', borderWidth: 1, borderColor: '#E5E7EB',
  },
  goalChipActive: { backgroundColor: '#1A1F71', borderColor: '#1A1F71' },
  goalChipText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  goalChipTextActive: { color: '#FFF' },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 6 },
  modalCancel: {
    flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, backgroundColor: '#F5F5FA',
  },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  modalSave: { flex: 2, borderRadius: 12, overflow: 'hidden' },
  modalSaveGradient: { paddingVertical: 14, alignItems: 'center', borderRadius: 12 },
  modalSaveText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});

