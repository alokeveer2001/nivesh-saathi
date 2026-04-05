// ═══════════════════════════════════════════════════════════════
// Nivesh Saathi — Core Types
// The complete type system for a Jarvis-level investment companion
// ═══════════════════════════════════════════════════════════════

export type RiskLevel = 'safe' | 'balanced' | 'aggressive';
export type GoalType = 'house' | 'education' | 'car' | 'travel' | 'emergency' | 'wealth' | 'retirement' | 'wedding' | 'custom';

export interface UserProfile {
  name: string;
  age: number;
  monthlyIncome: number;
  monthlyExpense: number;
  primaryGoal: GoalType;
  riskLevel: RiskLevel;
  onboardingComplete: boolean;
  // Extended profile
  familySize?: number;
  dependents?: number;
  hasHomeLoan?: boolean;
  hasCarLoan?: boolean;
  hasHealthInsurance?: boolean;
  hasLifeInsurance?: boolean;
  panLinked?: boolean;
}

// ═══════════════════════════════════════════
// Money Buckets (original system)
// ═══════════════════════════════════════════

export interface MoneyBucket {
  id: 'safe' | 'growth' | 'opportunity';
  name: string;
  description: string;
  percentage: number;
  currentAmount: number;
  targetAmount: number;
  color: string;
  returns: number;
}

// ═══════════════════════════════════════════
// Goals
// ═══════════════════════════════════════════

export interface Goal {
  id: string;
  name: string;
  type: GoalType;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  monthlySIP: number;
  bucket: 'safe' | 'growth' | 'opportunity';
  emoji: string;
}

// ═══════════════════════════════════════════
// Investments
// ═══════════════════════════════════════════

export interface Investment {
  id: string;
  amount: number;
  bucket: 'safe' | 'growth' | 'opportunity';
  goalId?: string;
  note: string;
  date: string;
}

// ═══════════════════════════════════════════
// Asset Portfolio — Track EVERYTHING
// ═══════════════════════════════════════════

export type AssetClass = 'mutual_fund' | 'stock' | 'gold' | 'fd' | 'ppf' | 'epf' | 'nps' | 'real_estate' | 'crypto' | 'bonds' | 'cash' | 'other';

export interface Asset {
  id: string;
  name: string;
  type: AssetClass;
  investedAmount: number;     // total cost basis
  currentValue: number;       // current market value
  returns: number;            // absolute return in ₹
  returnPercent: number;      // XIRR or simple %
  units?: number;             // for stocks/MF
  purchaseDate: string;
  lastUpdated: string;
  notes?: string;
  // Risk tagging
  riskLevel: RiskLevel;
  // Auto-classification
  bucket: 'safe' | 'growth' | 'opportunity';
}

export interface Liability {
  id: string;
  name: string;
  type: 'home_loan' | 'car_loan' | 'personal_loan' | 'credit_card' | 'education_loan' | 'other';
  principalAmount: number;
  outstandingAmount: number;
  emi: number;
  interestRate: number;
  endDate: string;
  emoji: string;
}

export interface InsurancePolicy {
  id: string;
  name: string;
  type: 'health' | 'life' | 'term' | 'vehicle' | 'other';
  coverAmount: number;
  premium: number;
  premiumFrequency: 'monthly' | 'quarterly' | 'yearly';
  renewalDate: string;
  provider: string;
  emoji: string;
}

export interface NetWorth {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  assetBreakdown: { type: AssetClass; value: number; percent: number }[];
  monthlyChange: number;
  monthlyChangePercent: number;
}

// ═══════════════════════════════════════════
// Watchlist — Track stocks/funds you're watching
// ═══════════════════════════════════════════

export interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  type: 'stock' | 'mutual_fund' | 'etf' | 'index' | 'gold' | 'crypto';
  currentPrice: number;
  changePercent: number;
  targetBuyPrice?: number;      // alert when price drops below
  targetSellPrice?: number;     // alert when price rises above
  notes?: string;
  addedDate: string;
}

// ═══════════════════════════════════════════
// Life Events — Major financial milestones
// ═══════════════════════════════════════════

export type LifeEventType = 'job_change' | 'salary_hike' | 'marriage' | 'baby' | 'home_purchase' | 'car_purchase' | 'relocation' | 'retirement_plan' | 'inheritance' | 'medical_emergency' | 'education_start' | 'custom';

export interface LifeEvent {
  id: string;
  type: LifeEventType;
  title: string;
  date: string;
  financialImpact: number;     // +ve or -ve
  notes: string;
  emoji: string;
}

// ═══════════════════════════════════════════
// AI Companion — Signals & Briefs
// ═══════════════════════════════════════════

export type SignalType = 'buy' | 'sell' | 'hold' | 'watch' | 'rebalance' | 'alert' | 'opportunity' | 'tax_action';

export interface AISignal {
  id: string;
  type: SignalType;
  title: string;
  description: string;
  assetName?: string;
  assetType?: AssetClass;
  urgency: 'high' | 'medium' | 'low';
  confidence: number;          // 0-100
  reasoning: string;           // why this signal
  actionLabel?: string;
  timestamp: string;
  read: boolean;
}

export interface DailyBrief {
  date: string;
  greeting: string;
  marketSummary: string;
  portfolioUpdate: string;
  topSignals: AISignal[];
  actionItems: string[];
  motivationalNote: string;
}

// ═══════════════════════════════════════════
// Tax Tracking
// ═══════════════════════════════════════════

export interface TaxProfile {
  regime: 'old' | 'new';
  section80C: number;          // max 1.5L
  section80D: number;          // health insurance
  hra: number;
  ltcg: number;                // long-term capital gains
  stcg: number;                // short-term capital gains
  elssInvested: number;
  npsInvested: number;
  totalTaxSaved: number;
  potentialSavings: number;    // how much more can be saved
}

// ═══════════════════════════════════════════
// Chat
// ═══════════════════════════════════════════

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

// ═══════════════════════════════════════════
// Existing types (kept for compat)
// ═══════════════════════════════════════════

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
  progress: number;
  name: string;
}

// ═══════════════════════════════════════════
// Portfolio Analytics
// ═══════════════════════════════════════════

export type InsightSeverity = 'critical' | 'warning' | 'info' | 'positive';
export type InsightCategory = 'risk' | 'allocation' | 'consistency' | 'goal' | 'opportunity' | 'behavior' | 'tax' | 'insurance' | 'debt' | 'market';

export interface Insight {
  id: string;
  title: string;
  description: string;
  severity: InsightSeverity;
  category: InsightCategory;
  actionLabel?: string;
  actionRoute?: string;
  dataPoints?: string;
}

export interface MonthlySnapshot {
  month: string;
  totalInvested: number;
  byBucket: { safe: number; growth: number; opportunity: number };
  investmentCount: number;
}

export interface PortfolioAnalysis {
  actualAllocation: { safe: number; growth: number; opportunity: number };
  targetAllocation: { safe: number; growth: number; opportunity: number };
  allocationDrift: number;
  investmentFrequency: number;
  averageInvestmentSize: number;
  consistencyScore: number;
  lastInvestmentDaysAgo: number;
  totalMonthsActive: number;
  statedRisk: RiskLevel;
  actualRisk: RiskLevel;
  riskMismatch: boolean;
  concentrationRisk: boolean;
  concentrationBucket?: string;
  goalHealthScores: { goalId: string; name: string; emoji: string; health: number; onTrack: boolean; monthsBehind: number }[];
  emergencyFundStatus: 'missing' | 'building' | 'complete';
  emergencyFundPercent: number;
  monthlyTrend: MonthlySnapshot[];
  isInvestingGrowing: boolean;
  insights: Insight[];
  summaryForAI: string;
}

export type OnboardingStep = 'welcome' | 'name' | 'age' | 'income' | 'expense' | 'goal' | 'risk' | 'plan_ready';

