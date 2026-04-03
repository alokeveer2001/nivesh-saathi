import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MoneyBucket } from '../types';
import { Colors } from '../constants/colors';
import { formatCurrency, formatFullCurrency, getProgressPercent } from '../utils/helpers';

interface MoneyBucketCardProps {
  bucket: MoneyBucket;
  investableAmount: number;
  onPress?: () => void;
  onInvest?: () => void;
}

export default function MoneyBucketCard({ bucket, investableAmount, onPress, onInvest }: MoneyBucketCardProps) {
  const monthlyAllocation = Math.round(investableAmount * bucket.percentage / 100);
  const progress = getProgressPercent(bucket.currentAmount, bucket.targetAmount);

  const colorMap = {
    safe: { bg: '#F0FDF4', gradient: ['#4CAF50', '#81C784'] as const, emoji: '🟢' },
    growth: { bg: '#FFFBEB', gradient: ['#FF9800', '#FFB74D'] as const, emoji: '🟡' },
    opportunity: { bg: '#FFF1F2', gradient: ['#E91E63', '#F48FB1'] as const, emoji: '🔴' },
  };

  const config = colorMap[bucket.id];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.container, { backgroundColor: config.bg }]}>
        <View style={styles.header}>
          <Text style={styles.emoji}>{config.emoji}</Text>
          <View style={styles.headerText}>
            <Text style={styles.name}>{bucket.name}</Text>
            <Text style={styles.desc}>{bucket.description}</Text>
          </View>
          <View style={styles.percentBadge}>
            <Text style={styles.percentText}>{bucket.percentage}%</Text>
          </View>
        </View>

        {/* Invested amount */}
        <View style={styles.investedRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.investedLabel}>Invested</Text>
            <Text style={[styles.investedAmount, { color: bucket.color }]}>
              {formatFullCurrency(bucket.currentAmount)}
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.investedLabel}>Monthly Plan</Text>
            <Text style={styles.monthlyAmount}>{formatFullCurrency(monthlyAllocation)}</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={styles.investedLabel}>Returns</Text>
            <Text style={styles.returnValue}>{bucket.returns}% p.a.</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBar}>
          <LinearGradient
            colors={config.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${Math.max(3, progress)}%` }]}
          />
        </View>
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>
            {formatCurrency(bucket.currentAmount)} / {formatCurrency(bucket.targetAmount)}
          </Text>
          <Text style={styles.progressPercent}>{progress}%</Text>
        </View>

        {/* Invest button */}
        {onInvest && (
          <TouchableOpacity style={styles.investButton} onPress={onInvest} activeOpacity={0.7}>
            <Text style={styles.investButtonText}>+ Record Investment</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  emoji: {
    fontSize: 20,
    marginRight: 10,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  desc: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  percentBadge: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  percentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  investedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  investedLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  investedAmount: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
  monthlyAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginTop: 2,
  },
  returnValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 2,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  progressPercent: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  investButton: {
    marginTop: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderStyle: 'dashed',
  },
  investButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
});

