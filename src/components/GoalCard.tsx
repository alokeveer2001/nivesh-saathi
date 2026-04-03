import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Goal } from '../types';
import { Colors } from '../constants/colors';
import { formatCurrency, getProgressPercent, getPlantStage, getPlantEmoji } from '../utils/helpers';

interface GoalCardProps {
  goal: Goal;
  onPress?: () => void;
}

export default function GoalCard({ goal, onPress }: GoalCardProps) {
  const progress = getProgressPercent(goal.currentAmount, goal.targetAmount);
  const plantStage = getPlantStage(progress);
  const plantEmoji = getPlantEmoji(plantStage);

  const monthsLeft = Math.max(0, Math.round(
    (new Date(goal.targetDate).getTime() - Date.now()) / (30 * 24 * 60 * 60 * 1000)
  ));

  const yearsLeft = Math.floor(monthsLeft / 12);
  const remainingMonths = monthsLeft % 12;
  const timeText = yearsLeft > 0
    ? `${yearsLeft}y ${remainingMonths}m baaki`
    : `${remainingMonths} months baaki`;

  const statusColor = progress >= 80 ? Colors.success : progress >= 40 ? Colors.warning : Colors.info;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <View style={styles.container}>
        <View style={styles.topRow}>
          <View style={styles.emojiContainer}>
            <Text style={styles.goalEmoji}>{goal.emoji}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{goal.name}</Text>
            <Text style={styles.timeLeft}>⏰ {timeText}</Text>
          </View>
          <View style={styles.plantContainer}>
            <Text style={styles.plantEmoji}>{plantEmoji}</Text>
            <Text style={styles.plantLabel}>{plantStage}</Text>
          </View>
        </View>

        <View style={styles.amountRow}>
          <Text style={styles.current}>{formatCurrency(goal.currentAmount)}</Text>
          <Text style={styles.target}>/ {formatCurrency(goal.targetAmount)}</Text>
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${Math.max(3, progress)}%`, backgroundColor: statusColor }]} />
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.sipText}>SIP: {formatCurrency(goal.monthlySIP)}/mo</Text>
          <Text style={[styles.progressPercent, { color: statusColor }]}>{progress}%</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  emojiContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goalEmoji: {
    fontSize: 22,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  timeLeft: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  plantContainer: {
    alignItems: 'center',
  },
  plantEmoji: {
    fontSize: 22,
  },
  plantLabel: {
    fontSize: 9,
    color: Colors.textLight,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  current: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  target: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sipText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '700',
  },
});

