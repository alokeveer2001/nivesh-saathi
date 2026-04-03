import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Dimensions, Platform, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/colors';
import { useUser } from '../context/UserContext';
import MoneyGarden from '../components/MoneyGarden';
import { formatCurrency, getProgressPercent, getPlantStage, getPlantEmoji } from '../utils/helpers';

const { width } = Dimensions.get('window');

export default function GardenScreen({ navigation }: any) {
  const { goals, user } = useUser();

  const plants = goals.map((goal) => {
    const progress = getProgressPercent(goal.currentAmount, goal.targetAmount);
    const stage = getPlantStage(progress);
    return {
      id: goal.id,
      name: goal.name,
      emoji: goal.emoji,
      plantEmoji: getPlantEmoji(stage),
      stage,
      progress,
      target: goal.targetAmount,
      current: goal.currentAmount,
    };
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <LinearGradient
        colors={['#0F0F1E', '#1A1F71']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 8 }}>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Money Garden 🌱</Text>
        <Text style={styles.headerSubtitle}>
          Invest karo aur dekho garden grow hota hai!
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Garden View */}
        <MoneyGarden />

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Plant Stages</Text>
          <View style={styles.legendRow}>
            {[
              { emoji: '🌰', label: 'Seed', range: '0-10%' },
              { emoji: '🌱', label: 'Sprout', range: '10-30%' },
              { emoji: '🌿', label: 'Sapling', range: '30-60%' },
              { emoji: '🌳', label: 'Tree', range: '60-90%' },
              { emoji: '🌳✨', label: 'Fruit Tree', range: '90-100%' },
            ].map((item) => (
              <View key={item.label} style={styles.legendItem}>
                <Text style={styles.legendEmoji}>{item.emoji}</Text>
                <Text style={styles.legendLabel}>{item.label}</Text>
                <Text style={styles.legendRange}>{item.range}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Plant Details */}
        <Text style={styles.sectionTitle}>Your Plants 🌿</Text>
        {plants.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌰</Text>
            <Text style={styles.emptyText}>
              Goals add karo aur yahan{'\n'}apna garden dekho! 🌱
            </Text>
          </View>
        ) : (
          plants.map((plant) => (
            <View key={plant.id} style={styles.plantCard}>
              <View style={styles.plantHeader}>
                <Text style={styles.plantGoalEmoji}>{plant.emoji}</Text>
                <View style={styles.plantInfo}>
                  <Text style={styles.plantName}>{plant.name}</Text>
                  <Text style={styles.plantStage}>
                    {plant.plantEmoji} {plant.stage.charAt(0).toUpperCase() + plant.stage.slice(1)}
                  </Text>
                </View>
                <Text style={styles.plantProgress}>{plant.progress}%</Text>
              </View>

              <View style={styles.plantProgressBar}>
                <LinearGradient
                  colors={['#4CAF50', '#81C784']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.plantProgressFill, { width: `${Math.max(3, plant.progress)}%` }]}
                />
              </View>

              <Text style={styles.plantAmount}>
                {formatCurrency(plant.current)} / {formatCurrency(plant.target)}
              </Text>

              {/* Growth tip */}
              <View style={styles.tipBox}>
                <Text style={styles.tipText}>
                  💡 {plant.progress < 30
                    ? 'Invest karte raho, jaldi sprout hoga!'
                    : plant.progress < 60
                    ? 'Achha chal raha hai! Sapling ban raha hai 🌿'
                    : plant.progress < 90
                    ? 'Bahut achha! Almost tree ban gaya! 🌳'
                    : 'Amazing! Fruit tree ban gaya! 🎉'
                  }
                </Text>
              </View>
            </View>
          ))
        )}

        {/* Fun fact */}
        <View style={styles.funFact}>
          <Text style={styles.funFactEmoji}>🧠</Text>
          <Text style={styles.funFactTitle}>Did you know?</Text>
          <Text style={styles.funFactText}>
            Warren Buffett ne 11 saal ki umar mein pehla stock khareeda tha!{'\n'}
            Late start is still a great start. 🚀
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 18,
    paddingTop: 20,
  },
  legend: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    alignItems: 'center',
  },
  legendEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  legendLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  legendRange: {
    fontSize: 9,
    color: Colors.textLight,
    marginTop: 1,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 24,
    marginBottom: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  plantCard: {
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
  plantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  plantGoalEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  plantInfo: {
    flex: 1,
  },
  plantName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  plantStage: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  plantProgress: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.safePocket,
  },
  plantProgressBar: {
    height: 10,
    backgroundColor: Colors.border,
    borderRadius: 5,
    overflow: 'hidden',
  },
  plantProgressFill: {
    height: '100%',
    borderRadius: 5,
  },
  plantAmount: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 6,
    textAlign: 'right',
  },
  tipBox: {
    backgroundColor: Colors.safePocketLight,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  tipText: {
    fontSize: 12,
    color: Colors.textPrimary,
    lineHeight: 17,
  },
  funFact: {
    backgroundColor: '#FFF8E1',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  funFactEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  funFactTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  funFactText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
});

