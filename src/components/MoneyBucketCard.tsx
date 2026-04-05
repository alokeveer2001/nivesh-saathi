import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MoneyBucket } from '../types';
import { formatCurrency, formatFullCurrency, getProgressPercent } from '../utils/helpers';

const C = {
  surface: '#111118', elevated: '#18181F', input: '#1E1E28',
  text: '#F0F0F5', textSec: '#9CA3AF', textMuted: '#6B7280',
  border: 'rgba(255,255,255,0.06)', success: '#34D399',
};

interface Props {
  bucket: MoneyBucket;
  investableAmount: number;
  onPress?: () => void;
  onInvest?: () => void;
}

export default function MoneyBucketCard({ bucket, investableAmount, onPress, onInvest }: Props) {
  const monthly = Math.round(investableAmount * bucket.percentage / 100);
  const progress = getProgressPercent(bucket.currentAmount, bucket.targetAmount);

  const config = {
    safe: { gradient: ['#34D399', '#10B981'] as const, emoji: '🟢', dotColor: '#34D399' },
    growth: { gradient: ['#FBBF24', '#F59E0B'] as const, emoji: '🟡', dotColor: '#FBBF24' },
    opportunity: { gradient: ['#F472B6', '#EC4899'] as const, emoji: '🔴', dotColor: '#F472B6' },
  }[bucket.id];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <View style={s.container}>
        <View style={s.header}>
          <View style={[s.dot, { backgroundColor: config.dotColor }]} />
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{bucket.name}</Text>
            <Text style={s.desc}>{bucket.description}</Text>
          </View>
          <View style={s.badge}><Text style={s.badgeText}>{bucket.percentage}%</Text></View>
        </View>

        <View style={s.statsRow}>
          <View>
            <Text style={s.statLabel}>INVESTED</Text>
            <Text style={[s.statValue, { color: config.dotColor }]}>{formatFullCurrency(bucket.currentAmount)}</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={s.statLabel}>MONTHLY</Text>
            <Text style={s.statValueSm}>{formatFullCurrency(monthly)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.statLabel}>RETURNS</Text>
            <Text style={[s.statValueSm, { color: C.success }]}>{bucket.returns}% p.a.</Text>
          </View>
        </View>

        <View style={s.progressBg}>
          <LinearGradient colors={config.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.progressFill, { width: `${Math.max(3, progress)}%` }]} />
        </View>
        <View style={s.progressRow}>
          <Text style={s.progressText}>{formatCurrency(bucket.currentAmount)} / {formatCurrency(bucket.targetAmount)}</Text>
          <Text style={s.progressPct}>{progress}%</Text>
        </View>

        {onInvest && (
          <TouchableOpacity style={s.investBtn} onPress={onInvest} activeOpacity={0.7}>
            <Text style={s.investBtnText}>+ Record Investment</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { backgroundColor: C.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  name: { fontSize: 14, fontWeight: '700', color: C.text },
  desc: { fontSize: 10, color: C.textMuted, marginTop: 1 },
  badge: { backgroundColor: C.input, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: C.border },
  badgeText: { fontSize: 11, fontWeight: '700', color: C.textSec },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  statLabel: { fontSize: 9, color: C.textMuted, letterSpacing: 0.5 },
  statValue: { fontSize: 18, fontWeight: '800', marginTop: 1 },
  statValueSm: { fontSize: 13, fontWeight: '700', color: C.textSec, marginTop: 1 },
  progressBg: { height: 4, backgroundColor: C.input, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  progressText: { fontSize: 10, color: C.textMuted },
  progressPct: { fontSize: 10, fontWeight: '700', color: C.textSec },
  investBtn: { marginTop: 10, backgroundColor: C.input, borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: C.border, borderStyle: 'dashed' },
  investBtnText: { fontSize: 12, fontWeight: '600', color: C.textSec },
});

