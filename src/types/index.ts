export type RiskLevel = 'safe' | 'balanced' | 'aggressive';

export type GoalType = 'house' | 'education' | 'car' | 'travel' | 'emergency' | 'wealth';

export interface UserProfile {
  name: string;
  age: number;
  monthlyIncome: number;
  monthlyExpense: number;
  primaryGoal: GoalType;
  riskLevel: RiskLevel;
  onboardingComplete: boolean;
}

export interface MoneyBucket {
  id: 'safe' | 'growth' | 'opportunity';
  name: string;
  description: string;
  percentage: number;       // % of investable amount
  currentAmount: number;
  targetAmount: number;
  color: string;
  returns: number;          // Expected annual return %
}

export interface Goal {
  id: string;
  name: string;
  type: GoalType;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;       // ISO date
  monthlySIP: number;
  bucket: 'safe' | 'growth' | 'opportunity';
  emoji: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  options?: ChatOption[];
  isTyping?: boolean;
}

export interface ChatOption {
  label: string;
  value: string;
  emoji?: string;
}

export interface InvestmentRecommendation {
  name: string;
  type: 'liquid_fund' | 'debt_fund' | 'equity_fund' | 'index_fund' | 'elss' | 'fd';
  expectedReturn: number;
  riskLevel: RiskLevel;
  minAmount: number;
  description: string;
  bucket: 'safe' | 'growth' | 'opportunity';
}

export interface NudgeItem {
  id: string;
  message: string;
  amount?: number;
  bucket?: 'safe' | 'growth' | 'opportunity';
  action?: string;
}

export interface GardenPlant {
  id: string;
  goalId: string;
  type: 'seed' | 'sprout' | 'sapling' | 'tree' | 'fruit_tree';
  progress: number;        // 0-100
  name: string;
}

export interface Investment {
  id: string;
  amount: number;
  bucket: 'safe' | 'growth' | 'opportunity';
  goalId?: string;          // optional link to a goal
  note: string;
  date: string;             // ISO date
}

// ═══════════════════════════════════════════
// Portfolio Analytics Types
// ═══════════════════════════════════════════

export type InsightSeverity = 'critical' | 'warning' | 'info' | 'positive';
export type InsightCategory = 'risk' | 'allocation' | 'consistency' | 'goal' | 'opportunity' | 'behavior';

export interface Insight {
  id: string;
  title: string;
  description: string;
  severity: InsightSeverity;
  category: InsightCategory;
  actionLabel?: string;        // CTA text
  actionRoute?: string;        // navigation target
  dataPoints?: string;         // the raw data backing this insight
}

export interface MonthlySnapshot {
  month: string;              // "2026-01", "2026-02"...
  totalInvested: number;
  byBucket: { safe: number; growth: number; opportunity: number };
  investmentCount: number;
}

export interface PortfolioAnalysis {
  // Allocation
  actualAllocation: { safe: number; growth: number; opportunity: number }; // percentages of total
  targetAllocation: { safe: number; growth: number; opportunity: number };
  allocationDrift: number;     // 0-100, how far from target

  // Behavior
  investmentFrequency: number; // avg investments per month
  averageInvestmentSize: number;
  consistencyScore: number;    // 0-100, how regular are they
  lastInvestmentDaysAgo: number;
  totalMonthsActive: number;

  // Risk
  statedRisk: RiskLevel;
  actualRisk: RiskLevel;       // computed from actual allocation
  riskMismatch: boolean;       // stated vs actual differ
  concentrationRisk: boolean;  // >70% in one bucket
  concentrationBucket?: string;

  // Goals
  goalHealthScores: { goalId: string; name: string; emoji: string; health: number; onTrack: boolean; monthsBehind: number }[];
  emergencyFundStatus: 'missing' | 'building' | 'complete';
  emergencyFundPercent: number;

  // Monthly trend
  monthlyTrend: MonthlySnapshot[];
  isInvestingGrowing: boolean; // are they investing more over time

  // Computed insights
  insights: Insight[];

  // Summary for AI
  summaryForAI: string;       // pre-built string to inject into LLM prompt
}

export type OnboardingStep =
  | 'welcome'
  | 'name'
  | 'age'
  | 'income'
  | 'expense'
  | 'goal'
  | 'risk'
  | 'plan_ready';

