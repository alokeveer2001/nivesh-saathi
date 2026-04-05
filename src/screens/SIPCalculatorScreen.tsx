import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, Platform, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { formatFullCurrency } from '../utils/helpers';

export default function SIPCalculatorScreen({ navigation }: any) {
  const [monthly, setMonthly] = useState('5000');
  const [years, setYears] = useState('10');
  const [rate, setRate] = useState('12');

  const m = parseInt(monthly) || 0;
  const y = parseInt(years) || 0;
  const r = parseFloat(rate) || 0;

  const monthlyRate = r / 100 / 12;
  const months = y * 12;
  const futureValue = monthlyRate > 0
    ? Math.round(m * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate))
    : m * months;
  const totalInvested = m * months;
  const gains = Math.max(0, futureValue - totalInvested);
  const growthMultiple = totalInvested > 0 ? (futureValue / totalInvested).toFixed(1) : '0';

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <LinearGradient colors={['#0B0B0F', '#111118']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SIP Calculator</Text>
        <Text style={styles.headerSub}>Dekho paisa kaise grow hoga 📈</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Inputs */}
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Monthly SIP (₹)</Text>
            <TextInput
              style={styles.input}
              value={monthly}
              onChangeText={setMonthly}
              keyboardType="numeric"
              placeholder="5000"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Years</Text>
              <TextInput
                style={styles.input}
                value={years}
                onChangeText={setYears}
                keyboardType="numeric"
                placeholder="10"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Expected Return (%)</Text>
              <TextInput
                style={styles.input}
                value={rate}
                onChangeText={setRate}
                keyboardType="decimal-pad"
                placeholder="12"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Quick select buttons */}
          <Text style={styles.quickLabel}>Quick: Return Rate</Text>
          <View style={styles.quickRow}>
            {['8', '10', '12', '15', '18'].map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.quickBtn, rate === r && styles.quickBtnActive]}
                onPress={() => setRate(r)}
              >
                <Text style={[styles.quickBtnText, rate === r && styles.quickBtnTextActive]}>
                  {r}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Result */}
        <LinearGradient colors={['#6C63FF', '#4F46E5']} style={styles.resultCard}>
          <Text style={styles.resultLabel}>Future Value</Text>
          <Text style={styles.resultAmount}>{formatFullCurrency(futureValue)}</Text>
          <Text style={styles.resultMultiple}>{growthMultiple}x growth</Text>

          <View style={styles.resultDivider} />

          <View style={styles.resultRow}>
            <View style={styles.resultItem}>
              <Text style={styles.resultItemLabel}>Invested</Text>
              <Text style={styles.resultItemValue}>{formatFullCurrency(totalInvested)}</Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={styles.resultItemLabel}>Gains</Text>
              <Text style={[styles.resultItemValue, { color: '#81C784' }]}>
                +{formatFullCurrency(gains)}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Visual Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Breakdown</Text>
          <View style={styles.barContainer}>
            <View style={[styles.barInvested, { flex: totalInvested }]} />
            <View style={[styles.barGains, { flex: Math.max(1, gains) }]} />
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#6B7280' }]} />
              <Text style={styles.legendText}>Invested ({Math.round(totalInvested / (futureValue || 1) * 100)}%)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.legendText}>Gains ({Math.round(gains / (futureValue || 1) * 100)}%)</Text>
            </View>
          </View>
        </View>

        {/* Milestones */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Year-wise Growth 📊</Text>
          {[1, 3, 5, 10, 15, 20].filter(yr => yr <= y).map(yr => {
            const ms = yr * 12;
            const fv = monthlyRate > 0
              ? Math.round(m * ((Math.pow(1 + monthlyRate, ms) - 1) / monthlyRate) * (1 + monthlyRate))
              : m * ms;
            return (
              <View key={yr} style={styles.milestoneRow}>
                <Text style={styles.milestoneYear}>{yr} yr</Text>
                <View style={styles.milestoneBar}>
                  <View style={[styles.milestoneFill, { width: `${Math.min(100, (fv / futureValue) * 100)}%` }]} />
                </View>
                <Text style={styles.milestoneAmount}>{formatFullCurrency(fv)}</Text>
              </View>
            );
          })}
        </View>

        {/* Tip */}
        <View style={styles.tipCard}>
          <Text style={styles.tipEmoji}>💡</Text>
          <Text style={styles.tipText}>
            SIP ka magic: Time &gt; Amount.{'\n'}
            ₹1000/month for 30 years beats ₹5000/month for 10 years!
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B0F' },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#0B0B0F',
  },
  backBtn: { marginBottom: 8 },
  backText: { color: '#6B7280', fontSize: 14, fontWeight: '600' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#F0F0F5', letterSpacing: -0.5 },
  headerSub: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  content: { padding: 18 },
  card: {
    backgroundColor: '#111118',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#F0F0F5', marginBottom: 14 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 6 },
  input: {
    backgroundColor: '#1E1E28', borderRadius: 12, paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 18, fontWeight: '700', color: '#F0F0F5',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  row: { flexDirection: 'row' },
  quickLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 8 },
  quickRow: { flexDirection: 'row', gap: 8 },
  quickBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 10,
    backgroundColor: '#1E1E28', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  quickBtnActive: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  quickBtnText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  quickBtnTextActive: { color: '#FFF' },
  resultCard: {
    borderRadius: 18, padding: 24, marginBottom: 14, alignItems: 'center',
  },
  resultLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1 },
  resultAmount: { fontSize: 32, fontWeight: '800', color: '#FFF', marginTop: 4 },
  resultMultiple: { fontSize: 14, color: '#34D399', fontWeight: '700', marginTop: 4 },
  resultDivider: { width: '80%', height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 16 },
  resultRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-around' },
  resultItem: { alignItems: 'center' },
  resultItemLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  resultItemValue: { fontSize: 16, fontWeight: '700', color: '#FFF', marginTop: 2 },
  barContainer: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 10 },
  barInvested: { backgroundColor: '#333', borderRadius: 6 },
  barGains: { backgroundColor: '#34D399', borderRadius: 6 },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  legendText: { fontSize: 12, color: '#6B7280' },
  milestoneRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  milestoneYear: { width: 36, fontSize: 12, fontWeight: '600', color: '#6B7280' },
  milestoneBar: { flex: 1, height: 8, backgroundColor: '#1E1E28', borderRadius: 4, overflow: 'hidden', marginHorizontal: 8 },
  milestoneFill: { height: '100%', backgroundColor: '#6C63FF', borderRadius: 4 },
  milestoneAmount: { fontSize: 12, fontWeight: '700', color: '#F0F0F5', width: 80, textAlign: 'right' },
  tipCard: {
    backgroundColor: 'rgba(251,191,36,0.08)', borderRadius: 14, padding: 16, flexDirection: 'row',
    alignItems: 'flex-start', borderWidth: 1, borderColor: 'rgba(251,191,36,0.15)',
  },
  tipEmoji: { fontSize: 20, marginRight: 10, marginTop: 2 },
  tipText: { flex: 1, fontSize: 13, color: '#FBBF24', lineHeight: 19 },
});

