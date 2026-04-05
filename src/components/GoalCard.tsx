import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Goal } from '../types';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency, getProgressPercent, getPlantStage, getPlantEmoji } from '../utils/helpers';

interface GoalCardProps {
  goal: Goal;
  onPress?: () => void;
}

export default function GoalCard({ goal, onPress }: GoalCardProps) {
  const { C } = useTheme();
  const st = useMemo(() => createStyles(C), [C]);

  const progress = getProgressPercent(goal.currentAmount, goal.targetAmount);
  const plantStage = getPlantStage(progress);
  const plantEmoji = getPlantEmoji(plantStage);

  const monthsLeft = Math.max(0, Math.round(
    (new Date(goal.targetDate).getTime() - Date.now()) / (30 * 24 * 60 * 60 * 1000)
  ));
  const yearsLeft = Math.floor(monthsLeft / 12);
  const remainingMonths = monthsLeft % 12;
  const timeText = yearsLeft > 0 ? `${yearsLeft}y ${remainingMonths}m baaki` : `${remainingMonths} months baaki`;

  const statusColor = progress >= 80 ? C.success : progress >= 40 ? C.warning : '#60A5FA';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <View style={st.container}>
        <View style={st.topRow}>
          <View style={st.emojiContainer}><Text style={{ fontSize: 22 }}>{goal.emoji}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={st.name}>{goal.name}</Text>
            <Text style={st.timeLeft}>⏰ {timeText}</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 22 }}>{plantEmoji}</Text>
            <Text style={st.plantLabel}>{plantStage}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 10 }}>
          <Text style={st.current}>{formatCurrency(goal.currentAmount)}</Text>
          <Text style={st.target}>/ {formatCurrency(goal.targetAmount)}</Text>
        </View>
        <View style={st.progressBar}>
          <View style={[st.progressFill, { width: `${Math.max(3, progress)}%`, backgroundColor: statusColor }]} />
        </View>
        <View style={st.bottomRow}>
          <Text style={st.sipText}>SIP: {formatCurrency(goal.monthlySIP)}/mo</Text>
          <Text style={[st.progressPercent, { color: statusColor }]}>{progress}%</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function createStyles(C: any) {
  return StyleSheet.create({
    container: { backgroundColor: C.surface, borderRadius: 18, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: C.border },
    topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    emojiContainer: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.input, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    name: { fontSize: 16, fontWeight: '700', color: C.text },
    timeLeft: { fontSize: 12, color: C.textSec, marginTop: 3 },
    plantLabel: { fontSize: 9, color: C.textMuted, textTransform: 'uppercase', marginTop: 2 },
    current: { fontSize: 20, fontWeight: '800', color: C.text },
    target: { fontSize: 14, color: C.textSec, marginLeft: 4 },
    progressBar: { height: 8, backgroundColor: C.input, borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 4 },
    bottomRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    sipText: { fontSize: 12, color: C.textSec },
    progressPercent: { fontSize: 13, fontWeight: '700' },
  });
}

