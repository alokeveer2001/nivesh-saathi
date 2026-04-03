/**
 * Portfolio Analyzer — The brain of Nivesh Saathi
 *
 * Analyzes the user's actual investment history, computes patterns,
 * detects risks, generates insights, and builds context for the AI.
 * Everything is data-driven — no assumptions.
 */

import {
  UserProfile, Investment, MoneyBucket, Goal,
  PortfolioAnalysis, Insight, MonthlySnapshot,
  RiskLevel, InsightSeverity, InsightCategory,
} from '../types';
import { generateId, formatFullCurrency } from '../utils/helpers';

// ═══════════════════════════════════════════
// Main entry point
// ═══════════════════════════════════════════
export function analyzePortfolio(
  user: UserProfile,
  investments: Investment[],
  buckets: MoneyBucket[],
  goals: Goal[],
): PortfolioAnalysis {
  const totalInvested = investments.reduce((s, i) => s + i.amount, 0);
  const investable = Math.max(0, user.monthlyIncome - user.monthlyExpense);

  // 1. Allocation analysis
  const byBucket = computeBucketTotals(investments);
  const actualAllocation = computeActualAllocation(byBucket, totalInvested);
  const targetAllocation = computeTargetAllocation(user.riskLevel);
  const allocationDrift = computeAllocationDrift(actualAllocation, targetAllocation);

  // 2. Behavior analysis
  const monthlyTrend = computeMonthlyTrend(investments);
  const frequency = computeFrequency(investments);
  const consistencyScore = computeConsistency(investments, monthlyTrend);
  const lastInvestmentDaysAgo = computeLastInvestmentDays(investments);
  const avgSize = totalInvested > 0 ? Math.round(totalInvested / investments.length) : 0;
  const totalMonthsActive = monthlyTrend.length;

  // 3. Risk analysis
  const actualRisk = inferActualRisk(actualAllocation);
  const riskMismatch = user.riskLevel !== actualRisk && investments.length >= 3;
  const { concentrationRisk, concentrationBucket } = detectConcentrationRisk(actualAllocation);

  // 4. Goal health
  const goalHealthScores = computeGoalHealth(goals, investments);
  const { emergencyFundStatus, emergencyFundPercent } = computeEmergencyFundStatus(goals, user);

  // 5. Trend analysis
  const isInvestingGrowing = detectGrowthTrend(monthlyTrend);

  // 6. Generate insights from all data
  const insights = generateInsights({
    user, investments, buckets, goals, totalInvested, investable,
    actualAllocation, targetAllocation, allocationDrift,
    frequency, consistencyScore, lastInvestmentDaysAgo, avgSize,
    actualRisk, riskMismatch, concentrationRisk, concentrationBucket,
    goalHealthScores, emergencyFundStatus, emergencyFundPercent,
    isInvestingGrowing, monthlyTrend, totalMonthsActive,
  });

  // 7. Build AI summary
  const summaryForAI = buildAISummary({
    user, totalInvested, investable, actualAllocation, targetAllocation,
    allocationDrift, frequency, consistencyScore, lastInvestmentDaysAgo,
    actualRisk, riskMismatch, concentrationRisk, concentrationBucket,
    goalHealthScores, emergencyFundStatus, emergencyFundPercent,
    isInvestingGrowing, totalMonthsActive, insights, investments,
  });

  return {
    actualAllocation, targetAllocation, allocationDrift,
    investmentFrequency: frequency,
    averageInvestmentSize: avgSize,
    consistencyScore, lastInvestmentDaysAgo, totalMonthsActive,
    statedRisk: user.riskLevel, actualRisk, riskMismatch,
    concentrationRisk, concentrationBucket,
    goalHealthScores, emergencyFundStatus, emergencyFundPercent,
    monthlyTrend, isInvestingGrowing,
    insights, summaryForAI,
  };
}

// ═══════════════════════════════════════════
// Computation functions
// ═══════════════════════════════════════════

function computeBucketTotals(investments: Investment[]) {
  const result = { safe: 0, growth: 0, opportunity: 0 };
  for (const inv of investments) {
    result[inv.bucket] += inv.amount;
  }
  return result;
}

function computeActualAllocation(byBucket: { safe: number; growth: number; opportunity: number }, total: number) {
  if (total === 0) return { safe: 0, growth: 0, opportunity: 0 };
  return {
    safe: Math.round((byBucket.safe / total) * 100),
    growth: Math.round((byBucket.growth / total) * 100),
    opportunity: Math.round((byBucket.opportunity / total) * 100),
  };
}

function computeTargetAllocation(riskLevel: RiskLevel) {
  const configs: Record<RiskLevel, { safe: number; growth: number; opportunity: number }> = {
    safe: { safe: 60, growth: 35, opportunity: 5 },
    balanced: { safe: 40, growth: 45, opportunity: 15 },
    aggressive: { safe: 20, growth: 45, opportunity: 35 },
  };
  return configs[riskLevel];
}

function computeAllocationDrift(actual: { safe: number; growth: number; opportunity: number }, target: { safe: number; growth: number; opportunity: number }) {
  const drift = (
    Math.abs(actual.safe - target.safe) +
    Math.abs(actual.growth - target.growth) +
    Math.abs(actual.opportunity - target.opportunity)
  ) / 2; // normalize to 0-100 scale
  return Math.min(100, Math.round(drift));
}

function computeMonthlyTrend(investments: Investment[]): MonthlySnapshot[] {
  const byMonth: Record<string, { total: number; safe: number; growth: number; opportunity: number; count: number }> = {};

  for (const inv of investments) {
    const d = new Date(inv.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!byMonth[key]) byMonth[key] = { total: 0, safe: 0, growth: 0, opportunity: 0, count: 0 };
    byMonth[key].total += inv.amount;
    byMonth[key][inv.bucket] += inv.amount;
    byMonth[key].count += 1;
  }

  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      totalInvested: data.total,
      byBucket: { safe: data.safe, growth: data.growth, opportunity: data.opportunity },
      investmentCount: data.count,
    }));
}

function computeFrequency(investments: Investment[]): number {
  if (investments.length < 2) return investments.length;
  const dates = investments.map(i => new Date(i.date).getTime()).sort();
  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];
  const monthsSpan = Math.max(1, (lastDate - firstDate) / (30 * 24 * 60 * 60 * 1000));
  return Math.round((investments.length / monthsSpan) * 10) / 10;
}

function computeConsistency(investments: Investment[], trend: MonthlySnapshot[]): number {
  if (investments.length === 0) return 0;
  if (investments.length === 1) return 20;
  if (trend.length <= 1) return 30;

  // Check how many of the last 6 months had investments
  const now = new Date();
  let monthsWithInvestment = 0;
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (trend.find(t => t.month === key)) monthsWithInvestment++;
  }

  // Score: 6/6 months = 100, 5/6 = 85, etc.
  const baseScore = Math.round((monthsWithInvestment / 6) * 100);

  // Bonus for regular amounts (low variance = more consistent)
  const amounts = investments.map(i => i.amount);
  const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length;
  const variance = amounts.reduce((s, a) => s + Math.pow(a - avg, 2), 0) / amounts.length;
  const cv = avg > 0 ? Math.sqrt(variance) / avg : 1; // coefficient of variation
  const regularityBonus = Math.max(0, Math.round((1 - cv) * 20)); // up to 20 bonus points

  return Math.min(100, baseScore + regularityBonus);
}

function computeLastInvestmentDays(investments: Investment[]): number {
  if (investments.length === 0) return 999;
  const latest = Math.max(...investments.map(i => new Date(i.date).getTime()));
  return Math.round((Date.now() - latest) / (24 * 60 * 60 * 1000));
}

function inferActualRisk(allocation: { safe: number; growth: number; opportunity: number }): RiskLevel {
  const riskyPercent = allocation.opportunity + allocation.growth * 0.5;
  if (riskyPercent >= 55) return 'aggressive';
  if (riskyPercent >= 30) return 'balanced';
  return 'safe';
}

function detectConcentrationRisk(allocation: { safe: number; growth: number; opportunity: number }) {
  const entries = Object.entries(allocation) as [string, number][];
  for (const [bucket, pct] of entries) {
    if (pct >= 70) {
      return { concentrationRisk: true, concentrationBucket: bucket };
    }
  }
  return { concentrationRisk: false, concentrationBucket: undefined };
}

function computeGoalHealth(goals: Goal[], investments: Investment[]) {
  return goals.map(goal => {
    const targetDate = new Date(goal.targetDate);
    const now = new Date();
    const totalMonths = Math.max(1, Math.round((targetDate.getTime() - now.getTime()) / (30 * 24 * 60 * 60 * 1000)));
    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
    const neededPerMonth = remaining / totalMonths;
    const health = goal.targetAmount > 0 ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0;

    // Check if on track: is current amount >= expected based on elapsed time
    const startDate = new Date(investments.find(i => i.goalId === goal.id)?.date || now.toISOString());
    const elapsedMonths = Math.max(1, Math.round((now.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000)));
    const expectedByNow = goal.monthlySIP * elapsedMonths;
    const onTrack = goal.currentAmount >= expectedByNow * 0.8; // 80% threshold
    const monthsBehind = Math.max(0, Math.round((expectedByNow - goal.currentAmount) / (goal.monthlySIP || 1)));

    return { goalId: goal.id, name: goal.name, emoji: goal.emoji, health, onTrack, monthsBehind };
  });
}

function computeEmergencyFundStatus(goals: Goal[], user: UserProfile) {
  const emergencyGoal = goals.find(g => g.type === 'emergency');
  const target = (user.monthlyExpense || 20000) * 6;

  if (!emergencyGoal) {
    return { emergencyFundStatus: 'missing' as const, emergencyFundPercent: 0 };
  }

  const percent = Math.round((emergencyGoal.currentAmount / target) * 100);
  if (percent >= 90) return { emergencyFundStatus: 'complete' as const, emergencyFundPercent: percent };
  return { emergencyFundStatus: 'building' as const, emergencyFundPercent: percent };
}

function detectGrowthTrend(trend: MonthlySnapshot[]): boolean {
  if (trend.length < 3) return false;
  const last3 = trend.slice(-3);
  return last3[2].totalInvested >= last3[0].totalInvested;
}

// ═══════════════════════════════════════════
// Insight Generation — The intelligence layer
// ═══════════════════════════════════════════

interface InsightInputs {
  user: UserProfile;
  investments: Investment[];
  buckets: MoneyBucket[];
  goals: Goal[];
  totalInvested: number;
  investable: number;
  actualAllocation: { safe: number; growth: number; opportunity: number };
  targetAllocation: { safe: number; growth: number; opportunity: number };
  allocationDrift: number;
  frequency: number;
  consistencyScore: number;
  lastInvestmentDaysAgo: number;
  avgSize: number;
  actualRisk: RiskLevel;
  riskMismatch: boolean;
  concentrationRisk: boolean;
  concentrationBucket?: string;
  goalHealthScores: { goalId: string; name: string; emoji: string; health: number; onTrack: boolean; monthsBehind: number }[];
  emergencyFundStatus: string;
  emergencyFundPercent: number;
  isInvestingGrowing: boolean;
  monthlyTrend: MonthlySnapshot[];
  totalMonthsActive: number;
}

function generateInsights(d: InsightInputs): Insight[] {
  const insights: Insight[] = [];
  const name = d.user.name;

  // ── No investments yet ──
  if (d.investments.length === 0) {
    insights.push(makeInsight(
      'Pehla kadam baaki hai!',
      `${name}, aapne abhi tak koi investment record nahi ki. Shuru karo — even ₹500 counts!`,
      'warning', 'behavior', 'Record Investment', 'Home',
    ));
    return insights;
  }

  // ── CRITICAL: Emergency fund missing ──
  if (d.emergencyFundStatus === 'missing') {
    insights.push(makeInsight(
      '🚨 Emergency Fund Nahi Hai',
      `${name}, aapke paas emergency fund goal nahi hai. 6 months expenses (${formatFullCurrency(d.user.monthlyExpense * 6)}) rakhna zaroori hai — bina iske investing risky hai.`,
      'critical', 'risk', 'Create Emergency Goal', 'Goals',
      `emergencyTarget=${d.user.monthlyExpense * 6}`,
    ));
  } else if (d.emergencyFundStatus === 'building' && d.emergencyFundPercent < 50) {
    insights.push(makeInsight(
      '⚠️ Emergency Fund Incomplete',
      `Emergency fund sirf ${d.emergencyFundPercent}% complete hai. Growth/Opportunity mein invest karne se pehle yeh banao.`,
      'warning', 'risk', 'View Goals', 'Goals',
      `emergencyPercent=${d.emergencyFundPercent}`,
    ));
  }

  // ── Risk mismatch: stated vs actual ──
  if (d.riskMismatch) {
    const statedLabel = { safe: 'Safe', balanced: 'Balanced', aggressive: 'Aggressive' }[d.user.riskLevel];
    const actualLabel = { safe: 'Safe', balanced: 'Balanced', aggressive: 'Aggressive' }[d.actualRisk];
    const isRiskier = d.actualRisk === 'aggressive' && d.user.riskLevel !== 'aggressive';

    insights.push(makeInsight(
      `Risk Mismatch Detected`,
      `Aapne khud ko "${statedLabel}" bataya tha, lekin aapki actual investing pattern "${actualLabel}" hai. ${isRiskier ? 'Zyada risk le rahe ho — kya yeh intentional hai?' : 'Aap planned se kam risk le rahe ho — growth miss ho sakti hai.'}`,
      isRiskier ? 'warning' : 'info', 'risk', 'Review Profile', 'Profile',
      `stated=${d.user.riskLevel},actual=${d.actualRisk},safe=${d.actualAllocation.safe}%,growth=${d.actualAllocation.growth}%,opp=${d.actualAllocation.opportunity}%`,
    ));
  }

  // ── Concentration risk ──
  if (d.concentrationRisk && d.concentrationBucket) {
    const bucketLabel = { safe: 'Safe Pocket', growth: 'Growth Pocket', opportunity: 'Opportunity Pocket' }[d.concentrationBucket] || d.concentrationBucket;
    insights.push(makeInsight(
      `⚠️ Portfolio Imbalanced`,
      `Aapka ${Math.max(d.actualAllocation.safe, d.actualAllocation.growth, d.actualAllocation.opportunity)}% paisa sirf ${bucketLabel} mein hai. Diversify karo — ek basket mein sab eggs mat rakho.`,
      'warning', 'allocation',
      undefined, undefined,
      `bucket=${d.concentrationBucket},percent=${Math.max(d.actualAllocation.safe, d.actualAllocation.growth, d.actualAllocation.opportunity)}`,
    ));
  }

  // ── Allocation drift ──
  if (d.allocationDrift > 20 && d.investments.length >= 5) {
    insights.push(makeInsight(
      'Rebalancing Needed',
      `Aapka portfolio target allocation se ${d.allocationDrift}% drift ho gaya hai. Target: Safe ${d.targetAllocation.safe}% / Growth ${d.targetAllocation.growth}% / Opp ${d.targetAllocation.opportunity}%. Actual: Safe ${d.actualAllocation.safe}% / Growth ${d.actualAllocation.growth}% / Opp ${d.actualAllocation.opportunity}%.`,
      'info', 'allocation',
      undefined, undefined,
      `drift=${d.allocationDrift}`,
    ));
  }

  // ── Consistency ──
  if (d.lastInvestmentDaysAgo > 45 && d.investments.length > 0) {
    insights.push(makeInsight(
      `${d.lastInvestmentDaysAgo} Din Ho Gaye! 📅`,
      `${name}, aapne ${d.lastInvestmentDaysAgo} din se invest nahi kiya. SIP miss mat karo — consistency hi key hai!`,
      'warning', 'consistency', 'Invest Now', 'Home',
      `daysSince=${d.lastInvestmentDaysAgo}`,
    ));
  }

  if (d.consistencyScore >= 80 && d.investments.length >= 5) {
    insights.push(makeInsight(
      'Great Consistency! 🎯',
      `${name}, aapka consistency score ${d.consistencyScore}/100 hai — bahut achha! Aise hi chalte raho.`,
      'positive', 'behavior',
      undefined, undefined,
      `score=${d.consistencyScore}`,
    ));
  } else if (d.consistencyScore < 40 && d.investments.length >= 3) {
    insights.push(makeInsight(
      'Consistency Improve Karo',
      `Investment consistency score sirf ${d.consistencyScore}/100 hai. Har mahine fixed date pe invest karne ki aadat banao — auto SIP best hai.`,
      'warning', 'consistency',
      undefined, undefined,
      `score=${d.consistencyScore}`,
    ));
  }

  // ── Goal health ──
  for (const g of d.goalHealthScores) {
    if (!g.onTrack && g.monthsBehind >= 2) {
      insights.push(makeInsight(
        `${g.emoji} ${g.name} — Peeche Hai`,
        `Yeh goal ~${g.monthsBehind} months peeche hai (${g.health}% complete). SIP badhao ya deadline extend karo.`,
        'warning', 'goal', 'View Goals', 'Goals',
        `goalId=${g.goalId},health=${g.health},behind=${g.monthsBehind}`,
      ));
    }
    if (g.health >= 90) {
      insights.push(makeInsight(
        `${g.emoji} ${g.name} — Almost Done! 🎉`,
        `Yeh goal ${g.health}% complete hai — bas thoda aur!`,
        'positive', 'goal',
      ));
    }
  }

  // ── Opportunity: growth potential ──
  if (d.actualAllocation.opportunity < 10 && d.user.riskLevel === 'aggressive' && d.totalInvested > 0) {
    insights.push(makeInsight(
      '📈 Opportunity Pocket Underused',
      `Aap aggressive investor ho lekin sirf ${d.actualAllocation.opportunity}% opportunity mein hai. Small/mid cap mein thoda allocate karo for higher growth.`,
      'info', 'opportunity', 'Record Investment', 'Home',
      `oppPercent=${d.actualAllocation.opportunity}`,
    ));
  }

  if (d.actualAllocation.safe > 50 && d.user.age < 35 && d.user.riskLevel !== 'safe') {
    insights.push(makeInsight(
      '💡 Young Hai, Grow Karo!',
      `${name}, age ${d.user.age} pe ${d.actualAllocation.safe}% safe mein zyada hai. Young age = zyada equity exposure lelo — time hai recover karne ka.`,
      'info', 'opportunity',
      undefined, undefined,
      `age=${d.user.age},safePercent=${d.actualAllocation.safe}`,
    ));
  }

  // ── Investing growth trend ──
  if (d.isInvestingGrowing && d.monthlyTrend.length >= 3) {
    insights.push(makeInsight(
      'Investment Amount Badh Raha Hai! 🚀',
      `Achha trend hai — aapki monthly investment amount grow ho rahi hai. Keep it up!`,
      'positive', 'behavior',
    ));
  }

  // ── Tax saving opportunity (ELSS season) ──
  const month = new Date().getMonth();
  if (month >= 0 && month <= 2) { // Jan-Mar = tax saving season
    const hasELSS = d.investments.some(i => i.note.toLowerCase().includes('elss') || i.note.toLowerCase().includes('tax'));
    if (!hasELSS) {
      insights.push(makeInsight(
        '💸 Tax Saving Season!',
        `Financial year end aa raha hai. ELSS mein invest karke Section 80C ka ₹1.5L deduction lo — abhi last chance hai!`,
        'info', 'opportunity', 'Ask Saathi', 'Saathi',
      ));
    }
  }

  // Sort: critical first, then warning, info, positive
  const severityOrder: Record<string, number> = { critical: 0, warning: 1, info: 2, positive: 3 };
  insights.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return insights;
}

function makeInsight(
  title: string, description: string, severity: InsightSeverity, category: InsightCategory,
  actionLabel?: string, actionRoute?: string, dataPoints?: string,
): Insight {
  return { id: generateId(), title, description, severity, category, actionLabel, actionRoute, dataPoints };
}

// ═══════════════════════════════════════════
// AI Summary Builder — feeds into LLM context
// ═══════════════════════════════════════════

function buildAISummary(d: {
  user: UserProfile; totalInvested: number; investable: number;
  actualAllocation: { safe: number; growth: number; opportunity: number };
  targetAllocation: { safe: number; growth: number; opportunity: number };
  allocationDrift: number; frequency: number; consistencyScore: number;
  lastInvestmentDaysAgo: number; actualRisk: RiskLevel; riskMismatch: boolean;
  concentrationRisk: boolean; concentrationBucket?: string;
  goalHealthScores: { goalId: string; name: string; emoji: string; health: number; onTrack: boolean; monthsBehind: number }[];
  emergencyFundStatus: string; emergencyFundPercent: number;
  isInvestingGrowing: boolean; totalMonthsActive: number;
  insights: Insight[]; investments: Investment[];
}): string {
  const lines: string[] = [];

  lines.push(`PORTFOLIO ANALYTICS (Real Data — ${d.investments.length} investments tracked):`);

  lines.push(`\nINVESTMENT SUMMARY:`);
  lines.push(`- Total Invested: ₹${d.totalInvested.toLocaleString('en-IN')}`);
  lines.push(`- Monthly Investable: ₹${d.investable.toLocaleString('en-IN')}`);
  lines.push(`- Investments Count: ${d.investments.length}`);
  lines.push(`- Active Months: ${d.totalMonthsActive}`);
  lines.push(`- Last Investment: ${d.lastInvestmentDaysAgo} days ago`);
  lines.push(`- Avg Investment Size: ₹${Math.round(d.totalInvested / Math.max(1, d.investments.length)).toLocaleString('en-IN')}`);

  lines.push(`\nALLOCATION:`);
  lines.push(`- Actual: Safe ${d.actualAllocation.safe}% | Growth ${d.actualAllocation.growth}% | Opportunity ${d.actualAllocation.opportunity}%`);
  lines.push(`- Target: Safe ${d.targetAllocation.safe}% | Growth ${d.targetAllocation.growth}% | Opportunity ${d.targetAllocation.opportunity}%`);
  lines.push(`- Drift from target: ${d.allocationDrift}%`);

  lines.push(`\nBEHAVIOR:`);
  lines.push(`- Consistency Score: ${d.consistencyScore}/100`);
  lines.push(`- Investment Frequency: ${d.frequency}/month`);
  lines.push(`- Trend: ${d.isInvestingGrowing ? 'Growing ↑' : 'Flat/Declining'}`);

  lines.push(`\nRISK:`);
  lines.push(`- Stated Risk: ${d.user.riskLevel}`);
  lines.push(`- Actual Risk (from behavior): ${d.actualRisk}`);
  lines.push(`- Risk Mismatch: ${d.riskMismatch ? 'YES' : 'No'}`);
  lines.push(`- Concentration Risk: ${d.concentrationRisk ? `YES — heavy in ${d.concentrationBucket}` : 'No'}`);

  lines.push(`\nGOALS:`);
  lines.push(`- Emergency Fund: ${d.emergencyFundStatus} (${d.emergencyFundPercent}%)`);
  for (const g of d.goalHealthScores) {
    lines.push(`- ${g.emoji} ${g.name}: ${g.health}% complete, ${g.onTrack ? 'on track' : `${g.monthsBehind}mo behind`}`);
  }

  const criticals = d.insights.filter(i => i.severity === 'critical');
  const warnings = d.insights.filter(i => i.severity === 'warning');
  if (criticals.length > 0 || warnings.length > 0) {
    lines.push(`\nACTIVE ALERTS:`);
    for (const i of [...criticals, ...warnings]) {
      lines.push(`- [${i.severity.toUpperCase()}] ${i.title}: ${i.description}`);
    }
  }

  lines.push(`\nIMPORTANT: Use the ABOVE real data to personalize your advice. Do NOT make assumptions. Reference specific numbers and insights.`);

  return lines.join('\n');
}

