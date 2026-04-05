/**
 * Expense Intelligence Service
 *
 * Tracks user's spending patterns, detects anomalies, and generates
 * proactive warnings about expense behavior relative to their investment plan.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, Investment } from '../types';
import { generateId } from '../utils/helpers';

const EXPENSES_KEY = '@nivesh_expenses';

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  note: string;
  date: string;
}

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'shopping'
  | 'bills'
  | 'entertainment'
  | 'health'
  | 'education'
  | 'rent'
  | 'other';

export const EXPENSE_CATEGORIES: { key: ExpenseCategory; label: string; emoji: string }[] = [
  { key: 'food', label: 'Food & Dining', emoji: '🍕' },
  { key: 'transport', label: 'Transport', emoji: '🚗' },
  { key: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { key: 'bills', label: 'Bills & Utilities', emoji: '💡' },
  { key: 'entertainment', label: 'Entertainment', emoji: '🎬' },
  { key: 'health', label: 'Health', emoji: '🏥' },
  { key: 'education', label: 'Education', emoji: '📚' },
  { key: 'rent', label: 'Rent/EMI', emoji: '🏠' },
  { key: 'other', label: 'Other', emoji: '📦' },
];

export interface ExpenseAnalysis {
  totalThisMonth: number;
  budgetUsed: number;          // percentage of monthly expense budget
  categoryBreakdown: { category: ExpenseCategory; amount: number; percent: number }[];
  topCategory: { category: ExpenseCategory; amount: number } | null;
  dailyAverage: number;
  projectedMonthEnd: number;   // projected total at month end
  isOverBudget: boolean;
  savingsAtRisk: number;       // how much investable amount is at risk
  warnings: ExpenseWarning[];
  investmentToExpenseRatio: number;
}

export interface ExpenseWarning {
  id: string;
  type: 'overspend' | 'category_spike' | 'savings_at_risk' | 'no_tracking' | 'positive';
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'info' | 'positive';
}

// ═══════════════════════════════════════════
// Persistence
// ═══════════════════════════════════════════

export async function loadExpenses(): Promise<Expense[]> {
  try {
    const data = await AsyncStorage.getItem(EXPENSES_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

export async function saveExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
  const expenses = await loadExpenses();
  const newExpense: Expense = { ...expense, id: generateId() };
  const updated = [newExpense, ...expenses];
  await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(updated));
  return newExpense;
}

export async function updateExpense(id: string, updates: Partial<Omit<Expense, 'id'>>): Promise<void> {
  const expenses = await loadExpenses();
  const updated = expenses.map(e => e.id === id ? { ...e, ...updates } : e);
  await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(updated));
}

export async function deleteExpense(id: string): Promise<void> {
  const expenses = await loadExpenses();
  await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses.filter(e => e.id !== id)));
}

export async function clearExpenses(): Promise<void> {
  await AsyncStorage.removeItem(EXPENSES_KEY);
}

// ═══════════════════════════════════════════
// Analysis Engine
// ═══════════════════════════════════════════

export function analyzeExpenses(
  expenses: Expense[],
  user: UserProfile,
  investments: Investment[],
): ExpenseAnalysis {
  const now = new Date();
  const thisMonth = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const totalThisMonth = thisMonth.reduce((s, e) => s + e.amount, 0);
  const monthlyBudget = user.monthlyExpense;
  const budgetUsed = monthlyBudget > 0 ? Math.round((totalThisMonth / monthlyBudget) * 100) : 0;

  // Category breakdown
  const catTotals: Record<string, number> = {};
  for (const e of thisMonth) {
    catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
  }
  const categoryBreakdown = Object.entries(catTotals)
    .map(([category, amount]) => ({
      category: category as ExpenseCategory,
      amount,
      percent: totalThisMonth > 0 ? Math.round((amount / totalThisMonth) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const topCategory = categoryBreakdown.length > 0
    ? { category: categoryBreakdown[0].category, amount: categoryBreakdown[0].amount }
    : null;

  // Daily average and projection
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dailyAverage = dayOfMonth > 0 ? Math.round(totalThisMonth / dayOfMonth) : 0;
  const projectedMonthEnd = Math.round(dailyAverage * daysInMonth);

  const isOverBudget = projectedMonthEnd > monthlyBudget * 1.1; // 10% buffer
  const investable = Math.max(0, user.monthlyIncome - user.monthlyExpense);
  const actualInvestable = Math.max(0, user.monthlyIncome - projectedMonthEnd);
  const savingsAtRisk = Math.max(0, investable - actualInvestable);

  // Investment to expense ratio
  const totalInvestedThisMonth = investments
    .filter(i => {
      const d = new Date(i.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, i) => s + i.amount, 0);
  const investmentToExpenseRatio = totalThisMonth > 0
    ? Math.round((totalInvestedThisMonth / totalThisMonth) * 100) / 100
    : 0;

  // Generate warnings
  const warnings = generateExpenseWarnings({
    totalThisMonth, budgetUsed, projectedMonthEnd, monthlyBudget,
    isOverBudget, savingsAtRisk, investable, categoryBreakdown,
    topCategory, dayOfMonth, daysInMonth, investmentToExpenseRatio,
    thisMonthCount: thisMonth.length, user,
  });

  return {
    totalThisMonth, budgetUsed, categoryBreakdown, topCategory,
    dailyAverage, projectedMonthEnd, isOverBudget, savingsAtRisk,
    warnings, investmentToExpenseRatio,
  };
}

interface WarningInputs {
  totalThisMonth: number;
  budgetUsed: number;
  projectedMonthEnd: number;
  monthlyBudget: number;
  isOverBudget: boolean;
  savingsAtRisk: number;
  investable: number;
  categoryBreakdown: { category: ExpenseCategory; amount: number; percent: number }[];
  topCategory: { category: ExpenseCategory; amount: number } | null;
  dayOfMonth: number;
  daysInMonth: number;
  investmentToExpenseRatio: number;
  thisMonthCount: number;
  user: UserProfile;
}

function generateExpenseWarnings(d: WarningInputs): ExpenseWarning[] {
  const warnings: ExpenseWarning[] = [];
  const name = d.user.name;

  if (d.thisMonthCount === 0) {
    warnings.push({
      id: generateId(), type: 'no_tracking',
      title: 'Track Your Expenses',
      message: `${name}, expenses track nahi ho rahi. Budget pe nazar rakhna zaroori hai — start tracking!`,
      severity: 'info',
    });
    return warnings;
  }

  // Over budget
  if (d.budgetUsed > 90 && d.dayOfMonth < d.daysInMonth * 0.8) {
    warnings.push({
      id: generateId(), type: 'overspend',
      title: '🚨 Budget Almost Over!',
      message: `Mahine ka ${d.budgetUsed}% budget kharcha ho gaya, aur ${d.daysInMonth - d.dayOfMonth} din baaqi hain. Spending control karo!`,
      severity: 'critical',
    });
  } else if (d.isOverBudget) {
    warnings.push({
      id: generateId(), type: 'overspend',
      title: '⚠️ Overspending Projected',
      message: `Iss rate pe mahine ka kharcha ~₹${d.projectedMonthEnd.toLocaleString('en-IN')} hoga — budget ₹${d.monthlyBudget.toLocaleString('en-IN')} se zyada. Investments pe asar padega.`,
      severity: 'warning',
    });
  }

  // Savings at risk
  if (d.savingsAtRisk > 0 && d.savingsAtRisk > d.investable * 0.3) {
    warnings.push({
      id: generateId(), type: 'savings_at_risk',
      title: '💸 Investments at Risk',
      message: `Overspending se ₹${d.savingsAtRisk.toLocaleString('en-IN')}/month investable amount kam ho raha hai. Pehle invest karo, phir kharcho.`,
      severity: 'warning',
    });
  }

  // Category spike
  if (d.topCategory && d.topCategory.amount > d.monthlyBudget * 0.4) {
    const catInfo = EXPENSE_CATEGORIES.find(c => c.key === d.topCategory!.category);
    warnings.push({
      id: generateId(), type: 'category_spike',
      title: `${catInfo?.emoji || '📊'} ${catInfo?.label || d.topCategory.category} High`,
      message: `${catInfo?.label} pe ₹${d.topCategory.amount.toLocaleString('en-IN')} — budget ka 40%+ ek category mein. Diversify spending.`,
      severity: 'warning',
    });
  }

  // Positive: good ratio
  if (d.investmentToExpenseRatio >= 0.3 && d.thisMonthCount >= 5) {
    warnings.push({
      id: generateId(), type: 'positive',
      title: '✅ Healthy Balance!',
      message: `Investment-to-expense ratio ${d.investmentToExpenseRatio}x hai — great financial discipline!`,
      severity: 'positive',
    });
  }

  return warnings;
}

// ═══════════════════════════════════════════
// Build expense context for AI
// ═══════════════════════════════════════════

export function buildExpenseContext(analysis: ExpenseAnalysis, user: UserProfile): string {
  const lines: string[] = [];
  lines.push('EXPENSE TRACKING (This Month):');
  lines.push(`- Total Spent: ₹${analysis.totalThisMonth.toLocaleString('en-IN')}`);
  lines.push(`- Budget Used: ${analysis.budgetUsed}% of ₹${user.monthlyExpense.toLocaleString('en-IN')}`);
  lines.push(`- Daily Average: ₹${analysis.dailyAverage.toLocaleString('en-IN')}`);
  lines.push(`- Projected Month End: ₹${analysis.projectedMonthEnd.toLocaleString('en-IN')}`);
  lines.push(`- Over Budget: ${analysis.isOverBudget ? 'YES' : 'No'}`);
  if (analysis.savingsAtRisk > 0) {
    lines.push(`- Investable Amount at Risk: ₹${analysis.savingsAtRisk.toLocaleString('en-IN')}`);
  }
  lines.push(`- Invest/Expense Ratio: ${analysis.investmentToExpenseRatio}x`);

  if (analysis.categoryBreakdown.length > 0) {
    lines.push('\nTop Categories:');
    for (const c of analysis.categoryBreakdown.slice(0, 3)) {
      const info = EXPENSE_CATEGORIES.find(cat => cat.key === c.category);
      lines.push(`  ${info?.emoji || ''} ${info?.label || c.category}: ₹${c.amount.toLocaleString('en-IN')} (${c.percent}%)`);
    }
  }

  if (analysis.warnings.filter(w => w.severity === 'critical' || w.severity === 'warning').length > 0) {
    lines.push('\nEXPENSE ALERTS:');
    for (const w of analysis.warnings.filter(w => w.severity !== 'positive' && w.severity !== 'info')) {
      lines.push(`- [${w.severity.toUpperCase()}] ${w.title}: ${w.message}`);
    }
  }

  return lines.join('\n');
}

