import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, MoneyBucket, Goal, GardenPlant, Investment } from '../types';
import { Colors } from '../constants/colors';
import { generateId } from '../utils/helpers';

interface UserContextType {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  buckets: MoneyBucket[];
  setBuckets: (buckets: MoneyBucket[]) => void;
  goals: Goal[];
  setGoals: (goals: Goal[]) => void;
  addGoal: (goal: Goal) => void;
  garden: GardenPlant[];
  setGarden: (garden: GardenPlant[]) => void;
  investments: Investment[];
  recordInvestment: (amount: number, bucketId: 'safe' | 'growth' | 'opportunity', goalId?: string, note?: string) => void;
  totalInvested: number;
  investableAmount: number;
  isLoading: boolean;
  resetAll: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEY = '@nivesh_saathi_user';
const GOALS_KEY = '@nivesh_saathi_goals';
const BUCKETS_KEY = '@nivesh_saathi_buckets';
const INVESTMENTS_KEY = '@nivesh_saathi_investments';

function createDefaultBuckets(investable: number, riskLevel: string): MoneyBucket[] {
  let safePercent = 40, growthPercent = 45, oppPercent = 15;

  if (riskLevel === 'safe') {
    safePercent = 60; growthPercent = 35; oppPercent = 5;
  } else if (riskLevel === 'aggressive') {
    safePercent = 20; growthPercent = 45; oppPercent = 35;
  }

  return [
    {
      id: 'safe',
      name: 'Safe Pocket',
      description: 'Emergency Fund • Liquid Funds',
      percentage: safePercent,
      currentAmount: 0,
      targetAmount: investable * (safePercent / 100) * 12,
      color: Colors.safePocket,
      returns: 7,
    },
    {
      id: 'growth',
      name: 'Growth Pocket',
      description: 'SIP • Mutual Funds',
      percentage: growthPercent,
      currentAmount: 0,
      targetAmount: investable * (growthPercent / 100) * 60,
      color: Colors.growthPocket,
      returns: 14,
    },
    {
      id: 'opportunity',
      name: 'Opportunity Pocket',
      description: 'High Growth • Stocks',
      percentage: oppPercent,
      currentAmount: 0,
      targetAmount: investable * (oppPercent / 100) * 36,
      color: Colors.opportunityPocket,
      returns: 20,
    },
  ];
}

function createDefaultGoals(user: UserProfile): Goal[] {
  const goalMap: Record<string, { name: string; emoji: string; target: number; years: number }> = {
    house: { name: 'Ghar Khareedna', emoji: '🏠', target: 5000000, years: 10 },
    education: { name: 'Bachche ki Padhai', emoji: '🎓', target: 2000000, years: 8 },
    car: { name: 'Nayi Gaadi', emoji: '🚗', target: 1000000, years: 5 },
    travel: { name: 'Dream Holiday', emoji: '✈️', target: 200000, years: 2 },
    emergency: { name: 'Emergency Fund', emoji: '🛡️', target: (user.monthlyExpense || 20000) * 6, years: 1 },
    wealth: { name: 'Paisa Grow Karna', emoji: '📈', target: 1000000, years: 5 },
  };

  const goalInfo = goalMap[user.primaryGoal] || goalMap.wealth;
  const targetDate = new Date();
  targetDate.setFullYear(targetDate.getFullYear() + goalInfo.years);

  return [
    {
      id: '1',
      name: goalInfo.name,
      type: user.primaryGoal,
      targetAmount: goalInfo.target,
      currentAmount: 0,
      targetDate: targetDate.toISOString(),
      monthlySIP: Math.round(goalInfo.target / (goalInfo.years * 12)),
      bucket: 'growth',
      emoji: goalInfo.emoji,
    },
    {
      id: '2',
      name: 'Emergency Fund',
      type: 'emergency',
      targetAmount: (user.monthlyExpense || 20000) * 6,
      currentAmount: 0,
      targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      monthlySIP: Math.round(((user.monthlyExpense || 20000) * 6) / 12),
      bucket: 'safe',
      emoji: '🛡️',
    },
  ];
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [buckets, setBucketsState] = useState<MoneyBucket[]>([]);
  const [goals, setGoalsState] = useState<Goal[]>([]);
  const [garden, setGarden] = useState<GardenPlant[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const investableAmount = user ? Math.max(0, user.monthlyIncome - user.monthlyExpense) : 0;
  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const [userData, goalsData, bucketsData, investData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(GOALS_KEY),
        AsyncStorage.getItem(BUCKETS_KEY),
        AsyncStorage.getItem(INVESTMENTS_KEY),
      ]);

      if (userData) {
        const parsed = JSON.parse(userData) as UserProfile;
        setUserState(parsed);

        const investable = Math.max(0, parsed.monthlyIncome - parsed.monthlyExpense);

        if (bucketsData) {
          setBucketsState(JSON.parse(bucketsData));
        } else {
          setBucketsState(createDefaultBuckets(investable, parsed.riskLevel));
        }

        if (goalsData) {
          setGoalsState(JSON.parse(goalsData));
        } else {
          const defaultGoals = createDefaultGoals(parsed);
          setGoalsState(defaultGoals);
        }

        if (investData) {
          setInvestments(JSON.parse(investData));
        }
      }
    } catch (e) {
      console.log('Error loading user:', e);
    }
    setIsLoading(false);
  };

  const persistBuckets = async (b: MoneyBucket[]) => {
    setBucketsState(b);
    await AsyncStorage.setItem(BUCKETS_KEY, JSON.stringify(b));
  };

  const persistGoals = async (g: Goal[]) => {
    setGoalsState(g);
    await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(g));
  };

  const persistInvestments = async (inv: Investment[]) => {
    setInvestments(inv);
    await AsyncStorage.setItem(INVESTMENTS_KEY, JSON.stringify(inv));
  };

  const setUser = async (newUser: UserProfile | null) => {
    setUserState(newUser);
    if (newUser) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      const investable = Math.max(0, newUser.monthlyIncome - newUser.monthlyExpense);
      const newBuckets = createDefaultBuckets(investable, newUser.riskLevel);
      await persistBuckets(newBuckets);
      const defaultGoals = createDefaultGoals(newUser);
      await persistGoals(defaultGoals);
      await persistInvestments([]);
    } else {
      await AsyncStorage.multiRemove([STORAGE_KEY, GOALS_KEY, BUCKETS_KEY, INVESTMENTS_KEY]);
      setBucketsState([]);
      setGoalsState([]);
      setInvestments([]);
    }
  };

  const updateUser = async (updates: Partial<UserProfile>) => {
    if (user) {
      const updated = { ...user, ...updates };
      setUserState(updated);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      // If income/expense/risk changed, recalc buckets but preserve currentAmount
      if (updates.monthlyIncome !== undefined || updates.monthlyExpense !== undefined || updates.riskLevel !== undefined) {
        const investable = Math.max(0, (updates.monthlyIncome ?? updated.monthlyIncome) - (updates.monthlyExpense ?? updated.monthlyExpense));
        const freshBuckets = createDefaultBuckets(investable, updated.riskLevel);
        // Preserve existing currentAmount
        const merged = freshBuckets.map(fb => {
          const existing = buckets.find(b => b.id === fb.id);
          return { ...fb, currentAmount: existing?.currentAmount ?? 0 };
        });
        await persistBuckets(merged);
      }
    }
  };

  const addGoal = async (goal: Goal) => {
    const updated = [...goals, goal];
    await persistGoals(updated);
  };

  // ═══════════════════════════════════════
  // Investment Recording
  // ═══════════════════════════════════════
  const recordInvestment = async (
    amount: number,
    bucketId: 'safe' | 'growth' | 'opportunity',
    goalId?: string,
    note?: string,
  ) => {
    if (amount <= 0) return;

    const investment: Investment = {
      id: generateId(),
      amount,
      bucket: bucketId,
      goalId,
      note: note || '',
      date: new Date().toISOString(),
    };

    // 1. Save investment record
    const updatedInvestments = [investment, ...investments];
    await persistInvestments(updatedInvestments);

    // 2. Update bucket currentAmount
    const updatedBuckets = buckets.map(b =>
      b.id === bucketId ? { ...b, currentAmount: b.currentAmount + amount } : b
    );
    await persistBuckets(updatedBuckets);

    // 3. Update goal currentAmount if linked
    if (goalId) {
      const updatedGoals = goals.map(g =>
        g.id === goalId ? { ...g, currentAmount: g.currentAmount + amount } : g
      );
      await persistGoals(updatedGoals);
    }
  };

  const setBuckets = async (b: MoneyBucket[]) => {
    await persistBuckets(b);
  };

  const setGoals = async (g: Goal[]) => {
    await persistGoals(g);
  };

  const resetAll = async () => {
    await AsyncStorage.clear();
    setUserState(null);
    setBucketsState([]);
    setGoalsState([]);
    setGarden([]);
    setInvestments([]);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        updateUser,
        buckets,
        setBuckets,
        goals,
        setGoals,
        addGoal,
        garden,
        setGarden,
        investments,
        recordInvestment,
        totalInvested,
        investableAmount,
        isLoading,
        resetAll,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}

