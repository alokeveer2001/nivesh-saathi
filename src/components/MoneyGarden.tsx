import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import { useUser } from '../context/UserContext';
import { getPlantStage, getPlantEmoji, getProgressPercent } from '../utils/helpers';

const { width } = Dimensions.get('window');

export default function MoneyGarden() {
  const { goals } = useUser();

  const plants = goals.map((goal) => {
    const progress = getProgressPercent(goal.currentAmount, goal.targetAmount);
    const stage = getPlantStage(progress);
    return {
      id: goal.id,
      emoji: getPlantEmoji(stage),
      name: goal.name,
      goalEmoji: goal.emoji,
      progress,
      stage,
    };
  });

  const getPlantSize = (stage: string) => {
    switch (stage) {
      case 'seed': return 28;
      case 'sprout': return 36;
      case 'sapling': return 48;
      case 'tree': return 60;
      case 'fruit_tree': return 72;
      default: return 36;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#87CEEB', '#B0E0E6', '#98FB98', '#228B22']}
        locations={[0, 0.5, 0.75, 1]}
        style={styles.garden}
      >
        {/* Sun */}
        <Text style={styles.sun}>☀️</Text>

        {/* Clouds */}
        <Text style={styles.cloud1}>☁️</Text>
        <Text style={styles.cloud2}>⛅</Text>

        {/* Plants */}
        <View style={styles.plantsRow}>
          {plants.length === 0 ? (
            <View style={styles.emptyGarden}>
              <Text style={styles.emptyEmoji}>🌰</Text>
              <Text style={styles.emptyText}>
                Goals add karo aur dekho{'\n'}garden grow hota hai! 🌱
              </Text>
            </View>
          ) : (
            plants.map((plant, index) => (
              <View
                key={plant.id}
                style={[
                  styles.plantItem,
                  { marginTop: index % 2 === 0 ? 20 : 40 },
                ]}
              >
                <Text style={[styles.plantEmoji, { fontSize: getPlantSize(plant.stage) }]}>
                  {plant.emoji}
                </Text>
                <Text style={styles.plantGoalEmoji}>{plant.goalEmoji}</Text>
                <Text style={styles.plantName} numberOfLines={1}>
                  {plant.name}
                </Text>
                <Text style={styles.plantProgress}>{plant.progress}%</Text>
              </View>
            ))
          )}
        </View>

        {/* Ground decoration */}
        <View style={styles.ground}>
          <Text style={styles.groundEmoji}>🌾  🌼  🦋  🌻  🌾</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  garden: {
    height: 240,
    width: '100%',
    position: 'relative',
    paddingTop: 10,
  },
  sun: {
    position: 'absolute',
    top: 10,
    right: 20,
    fontSize: 36,
  },
  cloud1: {
    position: 'absolute',
    top: 15,
    left: 30,
    fontSize: 24,
  },
  cloud2: {
    position: 'absolute',
    top: 30,
    left: width * 0.5,
    fontSize: 20,
  },
  plantsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  plantItem: {
    alignItems: 'center',
    maxWidth: 80,
  },
  plantEmoji: {
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  plantGoalEmoji: {
    fontSize: 14,
    marginTop: 2,
  },
  plantName: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  plantProgress: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  emptyGarden: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  ground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groundEmoji: {
    fontSize: 18,
    letterSpacing: 6,
  },
});

