import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  Modal, TextInput, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/colors';
import { useUser } from '../context/UserContext';
import { formatFullCurrency, parseAmount } from '../utils/helpers';
import { RiskLevel, GoalType } from '../types';
import { getApiKey, setApiKey, removeApiKey } from '../services/apiKeyStore';

export default function ProfileScreen() {
  const { user, investableAmount, buckets, goals, updateUser, resetAll } = useUser();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [editField, setEditField] = useState<string>('');
  const [editValue, setEditValue] = useState<string>('');
  const [apiKey, setApiKeyState] = useState<string>('');
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    const key = await getApiKey();
    setHasApiKey(!!key);
    if (key) setApiKeyState(key);
  };

  if (!user) return null;

  const riskLabels: Record<string, string> = {
    safe: '🛡️ Safe',
    balanced: '⚖️ Balanced',
    aggressive: '🚀 Aggressive',
  };

  const goalLabels: Record<string, string> = {
    house: '🏠 Ghar Khareedna',
    education: '🎓 Bachche ki Padhai',
    car: '🚗 Gaadi Lena',
    travel: '✈️ Holiday Trip',
    emergency: '🛡️ Emergency Fund',
    wealth: '📈 Paisa Grow Karna',
  };

  const openEdit = (field: string, currentValue: string) => {
    setEditField(field);
    setEditValue(currentValue);
    setShowEditModal(true);
  };

  const saveEdit = () => {
    switch (editField) {
      case 'name':
        if (editValue.trim()) updateUser({ name: editValue.trim() });
        break;
      case 'age':
        const age = parseInt(editValue);
        if (age > 0 && age < 120) updateUser({ age });
        break;
      case 'income':
        const income = parseAmount(editValue);
        if (income > 0) updateUser({ monthlyIncome: income });
        break;
      case 'expense':
        const expense = parseAmount(editValue);
        if (expense >= 0) updateUser({ monthlyExpense: expense });
        break;
    }
    setShowEditModal(false);
  };

  const handleRiskChange = (risk: RiskLevel) => {
    updateUser({ riskLevel: risk });
  };

  const handleSaveApiKey = async () => {
    if (apiKey.trim()) {
      await setApiKey(apiKey.trim());
      setHasApiKey(true);
    } else {
      await removeApiKey();
      setHasApiKey(false);
    }
    setShowApiModal(false);
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Everything?',
      'All data will be deleted. You\'ll need to start fresh.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => resetAll() },
      ]
    );
  };

  const EditableRow = ({ label, value, field, isNumeric }: {
    label: string; value: string; field: string; isNumeric?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.infoRow}
      onPress={() => openEdit(field, isNumeric ? value.replace(/[₹,/mo]/g, '').trim() : value)}
      activeOpacity={0.6}
    >
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={styles.editRow}>
        <Text style={styles.infoValue}>{value}</Text>
        <Text style={styles.editIcon}>✏️</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <LinearGradient colors={['#0F0F1E', '#1A1F71']} style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.headerName}>{user.name}</Text>
        <Text style={styles.headerAge}>
          {user.age} yrs · {riskLabels[user.riskLevel]}
        </Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Personal Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Personal Details</Text>
          <EditableRow label="Name" value={user.name} field="name" />
          <EditableRow label="Age" value={`${user.age}`} field="age" isNumeric />
          <EditableRow label="Monthly Income" value={formatFullCurrency(user.monthlyIncome)} field="income" isNumeric />
          <EditableRow label="Monthly Expense" value={formatFullCurrency(user.monthlyExpense)} field="expense" isNumeric />

          <View style={[styles.infoRow, styles.highlightRow]}>
            <Text style={styles.infoLabel}>Investable</Text>
            <Text style={[styles.infoValue, { color: '#10B981', fontWeight: '800' }]}>
              {formatFullCurrency(investableAmount)}/mo
            </Text>
          </View>
        </View>

        {/* Risk Profile */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Risk Profile</Text>
          <View style={styles.riskRow}>
            {(['safe', 'balanced', 'aggressive'] as RiskLevel[]).map(risk => (
              <TouchableOpacity
                key={risk}
                style={[styles.riskChip, user.riskLevel === risk && styles.riskChipActive]}
                onPress={() => handleRiskChange(risk)}
              >
                <Text style={[styles.riskText, user.riskLevel === risk && styles.riskTextActive]}>
                  {riskLabels[risk]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.subTitle}>Bucket Allocation</Text>
          {buckets.map(bucket => (
            <View key={bucket.id} style={styles.bucketRow}>
              <View style={[styles.bucketDot, { backgroundColor: bucket.color }]} />
              <Text style={styles.bucketName}>{bucket.name}</Text>
              <Text style={styles.bucketPercent}>{bucket.percentage}%</Text>
              <Text style={styles.bucketAmount}>
                {formatFullCurrency(Math.round(investableAmount * bucket.percentage / 100))}
              </Text>
            </View>
          ))}
        </View>

        {/* AI Settings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>AI Settings ✨</Text>
          <Text style={styles.aiDesc}>
            Add your OpenAI API key for GPT-4o powered responses.
            Without it, smart offline mode is used.
          </Text>
          <TouchableOpacity style={styles.apiButton} onPress={() => setShowApiModal(true)}>
            <View style={[styles.statusDot, hasApiKey && styles.statusDotActive]} />
            <Text style={styles.apiButtonText}>
              {hasApiKey ? 'API Key Connected ✅' : 'Add OpenAI API Key'}
            </Text>
            <Text style={styles.apiArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>About</Text>
          <Text style={styles.aboutText}>
            Nivesh Saathi — AI-powered financial companion for Bharat.{'\n'}
            Invest smart, grow wealth, in your language.
          </Text>
          <Text style={styles.version}>v1.0.0 · Made with ❤️ for Bharat</Text>
        </View>

        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.resetText}>Reset Everything</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Edit {editField.charAt(0).toUpperCase() + editField.slice(1)}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={editValue}
              onChangeText={setEditValue}
              autoFocus
              keyboardType={
                ['age', 'income', 'expense'].includes(editField) ? 'numeric' : 'default'
              }
              placeholder={`Enter ${editField}`}
              placeholderTextColor="#9CA3AF"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={saveEdit}>
                <LinearGradient
                  colors={['#1A1F71', '#3F51B5']}
                  style={styles.modalSaveGradient}
                >
                  <Text style={styles.modalSaveText}>Save</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* API Key Modal */}
      <Modal visible={showApiModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>OpenAI API Key</Text>
            <Text style={styles.modalDesc}>
              Enter your API key for GPT-4o powered chat.{'\n'}
              Get it from platform.openai.com
            </Text>
            <TextInput
              style={styles.modalInput}
              value={apiKey}
              onChangeText={setApiKeyState}
              autoFocus
              placeholder="sk-..."
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              autoCapitalize="none"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowApiModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleSaveApiKey}>
                <LinearGradient
                  colors={['#1A1F71', '#3F51B5']}
                  style={styles.modalSaveGradient}
                >
                  <Text style={styles.modalSaveText}>Save</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            {hasApiKey && (
              <TouchableOpacity
                style={styles.removeKeyBtn}
                onPress={async () => {
                  await removeApiKey();
                  setHasApiKey(false);
                  setApiKeyState('');
                  setShowApiModal(false);
                }}
              >
                <Text style={styles.removeKeyText}>Remove API Key</Text>
              </TouchableOpacity>
            )}
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
    paddingBottom: 28,
    alignItems: 'center',
  },
  avatarCircle: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
    marginBottom: 10, borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)',
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#FFF' },
  headerName: { fontSize: 22, fontWeight: '800', color: '#FFF', letterSpacing: -0.3 },
  headerAge: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  contentContainer: { padding: 18 },
  card: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 18, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 14 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F5',
  },
  highlightRow: {
    backgroundColor: '#F0FDF4', marginHorizontal: -18, paddingHorizontal: 18,
    borderBottomWidth: 0, borderRadius: 10, marginTop: 6,
  },
  infoLabel: { fontSize: 14, color: '#6B7280' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  editRow: { flexDirection: 'row', alignItems: 'center' },
  editIcon: { fontSize: 12, marginLeft: 8, opacity: 0.5 },
  subTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A2E', marginTop: 16, marginBottom: 10 },
  riskRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  riskChip: {
    flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F5F5FA',
    alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB',
  },
  riskChipActive: { backgroundColor: '#1A1F71', borderColor: '#1A1F71' },
  riskText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  riskTextActive: { color: '#FFF' },
  bucketRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  bucketDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  bucketName: { flex: 1, fontSize: 13, color: '#374151' },
  bucketPercent: { fontSize: 13, fontWeight: '700', color: '#6B7280', marginRight: 12 },
  bucketAmount: { fontSize: 13, fontWeight: '700', color: '#1A1A2E', width: 70, textAlign: 'right' },
  aiDesc: { fontSize: 13, color: '#6B7280', lineHeight: 19, marginBottom: 12 },
  apiButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5FA',
    borderRadius: 12, padding: 14,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D1D5DB', marginRight: 10 },
  statusDotActive: { backgroundColor: '#10B981' },
  apiButtonText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#374151' },
  apiArrow: { fontSize: 16, color: '#9CA3AF' },
  aboutText: { fontSize: 13, color: '#6B7280', lineHeight: 20 },
  version: { fontSize: 11, color: '#9CA3AF', marginTop: 10, textAlign: 'center' },
  resetButton: {
    backgroundColor: '#FEF2F2', borderRadius: 12, paddingVertical: 14, alignItems: 'center',
    borderWidth: 1, borderColor: '#FECACA',
  },
  resetText: { fontSize: 14, fontWeight: '600', color: '#DC2626' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center',
    paddingHorizontal: 30,
  },
  modalContent: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 24,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', marginBottom: 6 },
  modalDesc: { fontSize: 13, color: '#6B7280', lineHeight: 19, marginBottom: 14 },
  modalInput: {
    backgroundColor: '#F5F5FA', borderRadius: 12, paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 16, color: '#1A1A2E', marginTop: 8, marginBottom: 16,
  },
  modalButtons: { flexDirection: 'row', gap: 10 },
  modalCancel: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12, backgroundColor: '#F5F5FA' },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  modalSave: { flex: 2, borderRadius: 12, overflow: 'hidden' },
  modalSaveGradient: { paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  modalSaveText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  removeKeyBtn: { marginTop: 12, alignItems: 'center', paddingVertical: 8 },
  removeKeyText: { fontSize: 13, color: '#DC2626', fontWeight: '600' },
});

