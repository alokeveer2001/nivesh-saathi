import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/colors';
import { useUser } from '../context/UserContext';
import GoalCard from '../components/GoalCard';
import { Goal, GoalType } from '../types';
import { generateId, parseAmount, formatFullCurrency, calculateFutureValue } from '../utils/helpers';

const GOAL_PRESETS: { type: GoalType; label: string; emoji: string; defaultTarget: number; years: number }[] = [
  { type: 'house', label: 'Ghar Khareedna', emoji: '🏠', defaultTarget: 5000000, years: 10 },
  { type: 'education', label: 'Bachche ki Padhai', emoji: '🎓', defaultTarget: 2000000, years: 8 },
  { type: 'car', label: 'Nayi Gaadi', emoji: '🚗', defaultTarget: 1000000, years: 5 },
  { type: 'travel', label: 'Dream Holiday', emoji: '✈️', defaultTarget: 200000, years: 2 },
  { type: 'emergency', label: 'Emergency Fund', emoji: '🛡️', defaultTarget: 300000, years: 1 },
  { type: 'wealth', label: 'Paisa Grow Karna', emoji: '📈', defaultTarget: 1000000, years: 5 },
];

export default function GoalsScreen() {
  const { goals, addGoal } = useUser();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<typeof GOAL_PRESETS[0] | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [customName, setCustomName] = useState('');

  const handleAddGoal = () => {
    if (!selectedPreset) return;

    const amount = customAmount ? parseAmount(customAmount) : selectedPreset.defaultTarget;
    const name = customName || selectedPreset.label;

    const targetDate = new Date();
    targetDate.setFullYear(targetDate.getFullYear() + selectedPreset.years);

    const monthlySIP = Math.round(amount / (selectedPreset.years * 12));

    const newGoal: Goal = {
      id: generateId(),
      name,
      type: selectedPreset.type,
      targetAmount: amount,
      currentAmount: 0,
      targetDate: targetDate.toISOString(),
      monthlySIP,
      bucket: selectedPreset.type === 'emergency' ? 'safe' : 'growth',
      emoji: selectedPreset.emoji,
    };

    addGoal(newGoal);
    setShowAddModal(false);
    setSelectedPreset(null);
    setCustomAmount('');
    setCustomName('');
  };

  const totalGoalAmount = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalCurrentAmount = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalMonthlySIP = goals.reduce((sum, g) => sum + g.monthlySIP, 0);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <LinearGradient
        colors={['#0F0F1E', '#1A1F71']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Mere Goals 🎯</Text>
        <Text style={styles.headerSubtitle}>
          Sapne dekhiye, hum plan banate hain
        </Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Target</Text>
            <Text style={styles.summaryValue}>{formatFullCurrency(totalGoalAmount)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Monthly SIP</Text>
            <Text style={styles.summaryValue}>{formatFullCurrency(totalMonthlySIP)}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {goals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={styles.emptyTitle}>Koi goal nahi hai abhi</Text>
            <Text style={styles.emptySubtitle}>
              Apna pehla goal add karo aur{'\n'}money garden mein seed lagao! 🌱
            </Text>
          </View>
        ) : (
          goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))
        )}

        {/* Add Goal Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#1A1F71', '#3F51B5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addButtonGradient}
          >
            <Text style={styles.addButtonText}>+ Naya Goal Add Karo</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Goal Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Naya Goal 🎯</Text>
            <Text style={styles.modalSubtitle}>Kya achieve karna hai?</Text>

            {!selectedPreset ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.presetGrid}>
                  {GOAL_PRESETS.map((preset) => (
                    <TouchableOpacity
                      key={preset.type}
                      style={styles.presetCard}
                      onPress={() => setSelectedPreset(preset)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.presetEmoji}>{preset.emoji}</Text>
                      <Text style={styles.presetLabel}>{preset.label}</Text>
                      <Text style={styles.presetAmount}>
                        ~{formatFullCurrency(preset.defaultTarget)}
                      </Text>
                      <Text style={styles.presetYears}>{preset.years} years</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            ) : (
              <View style={styles.customizeForm}>
                <Text style={styles.selectedEmoji}>{selectedPreset.emoji}</Text>
                <Text style={styles.selectedLabel}>{selectedPreset.label}</Text>

                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Goal Name (optional)</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder={selectedPreset.label}
                    placeholderTextColor={Colors.textLight}
                    value={customName}
                    onChangeText={setCustomName}
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Target Amount</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder={formatFullCurrency(selectedPreset.defaultTarget)}
                    placeholderTextColor={Colors.textLight}
                    value={customAmount}
                    onChangeText={setCustomAmount}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.sipPreview}>
                  <Text style={styles.sipPreviewLabel}>Monthly SIP needed:</Text>
                  <Text style={styles.sipPreviewAmount}>
                    {formatFullCurrency(
                      Math.round(
                        (customAmount ? parseAmount(customAmount) : selectedPreset.defaultTarget) /
                        (selectedPreset.years * 12)
                      )
                    )}/month
                  </Text>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setSelectedPreset(null)}
                  >
                    <Text style={styles.cancelText}>← Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleAddGoal}
                  >
                    <LinearGradient
                      colors={['#1A1F71', '#3F51B5']}
                      style={styles.confirmGradient}
                    >
                      <Text style={styles.confirmText}>Add Goal ✅</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.closeModal}
              onPress={() => {
                setShowAddModal(false);
                setSelectedPreset(null);
              }}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFF',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textOnPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textOnPrimary,
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 18,
    paddingTop: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  addButton: {
    marginTop: 10,
    borderRadius: 16,
    overflow: 'hidden',
  },
  addButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 16,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textOnAccent,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  presetCard: {
    width: '47%',
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  presetLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  presetAmount: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  presetYears: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 2,
  },
  customizeForm: {
    alignItems: 'center',
  },
  selectedEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  selectedLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  formField: {
    width: '100%',
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: Colors.background,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sipPreview: {
    backgroundColor: Colors.safePocketLight,
    borderRadius: 14,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  sipPreviewLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  sipPreviewAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.safePocket,
    marginTop: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: Colors.background,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  confirmButton: {
    flex: 2,
    borderRadius: 14,
    overflow: 'hidden',
  },
  confirmGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 14,
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textOnPrimary,
  },
  closeModal: {
    position: 'absolute',
    top: 16,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
});

