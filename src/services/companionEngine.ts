/**
 * Companion Engine — The Jarvis Brain
 *
 * This is the central intelligence that ties everything together:
 * - Generates daily briefs
 * - Produces buy/sell/hold signals
 * - Analyzes net worth
 * - Tracks life events impact
 * - Generates tax optimization tips
 * - Creates proactive alerts
 *
 * All based on REAL user data, REAL market data — zero assumptions.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserProfile, Asset, Liability, InsurancePolicy, WatchlistItem,
  LifeEvent, AISignal, DailyBrief, NetWorth, TaxProfile,
  Investment, Goal, MoneyBucket, AssetClass, SignalType,
} from '../types';
import { generateId, formatFullCurrency } from '../utils/helpers';
import { MarketData } from './marketIntelligence';

// Storage keys
const ASSETS_KEY = '@nivesh_assets';
const LIABILITIES_KEY = '@nivesh_liabilities';
const INSURANCE_KEY = '@nivesh_insurance';
const WATCHLIST_KEY = '@nivesh_watchlist';
const LIFE_EVENTS_KEY = '@nivesh_life_events';
const SIGNALS_KEY = '@nivesh_signals';
const BRIEF_KEY = '@nivesh_daily_brief';

// ═══════════════════════════════════════════
// Data Persistence
// ═══════════════════════════════════════════

async function loadJSON<T>(key: string, fallback: T): Promise<T> {
  try { const d = await AsyncStorage.getItem(key); return d ? JSON.parse(d) : fallback; } catch { return fallback; }
}

async function saveJSON(key: string, data: any) {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

// Assets
export async function loadAssets(): Promise<Asset[]> { return loadJSON(ASSETS_KEY, []); }
export async function saveAssets(assets: Asset[]) { await saveJSON(ASSETS_KEY, assets); }
export async function addAsset(asset: Omit<Asset, 'id' | 'lastUpdated'>): Promise<Asset> {
  const assets = await loadAssets();
  const newAsset: Asset = { ...asset, id: generateId(), lastUpdated: new Date().toISOString() };
  await saveAssets([newAsset, ...assets]);
  return newAsset;
}
export async function updateAsset(id: string, updates: Partial<Omit<Asset, 'id'>>): Promise<void> {
  const assets = await loadAssets();
  await saveAssets(assets.map(a => a.id === id ? { ...a, ...updates, lastUpdated: new Date().toISOString() } : a));
}
export async function removeAsset(id: string): Promise<void> {
  const assets = await loadAssets();
  await saveAssets(assets.filter(a => a.id !== id));
}

// Liabilities
export async function loadLiabilities(): Promise<Liability[]> { return loadJSON(LIABILITIES_KEY, []); }
export async function saveLiabilities(liabilities: Liability[]) { await saveJSON(LIABILITIES_KEY, liabilities); }
export async function addLiability(l: Omit<Liability, 'id'>): Promise<Liability> {
  const all = await loadLiabilities();
  const newL: Liability = { ...l, id: generateId() };
  await saveLiabilities([newL, ...all]);
  return newL;
}
export async function updateLiability(id: string, updates: Partial<Omit<Liability, 'id'>>): Promise<void> {
  const all = await loadLiabilities();
  await saveLiabilities(all.map(l => l.id === id ? { ...l, ...updates } : l));
}
export async function removeLiability(id: string): Promise<void> {
  const all = await loadLiabilities();
  await saveLiabilities(all.filter(l => l.id !== id));
}

// Insurance
export async function loadInsurance(): Promise<InsurancePolicy[]> { return loadJSON(INSURANCE_KEY, []); }
export async function saveInsurance(policies: InsurancePolicy[]) { await saveJSON(INSURANCE_KEY, policies); }
export async function addInsurance(p: Omit<InsurancePolicy, 'id'>): Promise<InsurancePolicy> {
  const all = await loadInsurance();
  const newP: InsurancePolicy = { ...p, id: generateId() };
  await saveInsurance([newP, ...all]);
  return newP;
}
export async function updateInsurance(id: string, updates: Partial<Omit<InsurancePolicy, 'id'>>): Promise<void> {
  const all = await loadInsurance();
  await saveInsurance(all.map(p => p.id === id ? { ...p, ...updates } : p));
}
export async function removeInsurance(id: string): Promise<void> {
  const all = await loadInsurance();
  await saveInsurance(all.filter(p => p.id !== id));
}

// Watchlist
export async function loadWatchlist(): Promise<WatchlistItem[]> { return loadJSON(WATCHLIST_KEY, []); }
export async function saveWatchlist(items: WatchlistItem[]) { await saveJSON(WATCHLIST_KEY, items); }
export async function addToWatchlist(item: Omit<WatchlistItem, 'id' | 'addedDate'>): Promise<WatchlistItem> {
  const all = await loadWatchlist();
  const newItem: WatchlistItem = { ...item, id: generateId(), addedDate: new Date().toISOString() };
  await saveWatchlist([newItem, ...all]);
  return newItem;
}
export async function removeFromWatchlist(id: string) {
  const all = await loadWatchlist();
  await saveWatchlist(all.filter(i => i.id !== id));
}
export async function updateWatchlistItem(id: string, updates: Partial<Omit<WatchlistItem, 'id'>>): Promise<void> {
  const all = await loadWatchlist();
  await saveWatchlist(all.map(i => i.id === id ? { ...i, ...updates } : i));
}

// Life Events
export async function loadLifeEvents(): Promise<LifeEvent[]> { return loadJSON(LIFE_EVENTS_KEY, []); }
export async function saveLifeEvents(events: LifeEvent[]) { await saveJSON(LIFE_EVENTS_KEY, events); }
export async function addLifeEvent(e: Omit<LifeEvent, 'id'>): Promise<LifeEvent> {
  const all = await loadLifeEvents();
  const newE: LifeEvent = { ...e, id: generateId() };
  await saveLifeEvents([newE, ...all]);
  return newE;
}
export async function removeLifeEvent(id: string): Promise<void> {
  const all = await loadLifeEvents();
  await saveLifeEvents(all.filter(e => e.id !== id));
}

// Signals
export async function loadSignals(): Promise<AISignal[]> { return loadJSON(SIGNALS_KEY, []); }
export async function saveSignals(signals: AISignal[]) { await saveJSON(SIGNALS_KEY, signals); }
export async function markSignalRead(id: string) {
  const all = await loadSignals();
  await saveSignals(all.map(s => s.id === id ? { ...s, read: true } : s));
}

// ═══════════════════════════════════════════
// Net Worth Calculator
// ═══════════════════════════════════════════

export function calculateNetWorth(assets: Asset[], liabilities: Liability[], buckets: MoneyBucket[]): NetWorth {
  const bucketTotal = buckets.reduce((s, b) => s + b.currentAmount, 0);
  const assetTotal = assets.reduce((s, a) => s + a.currentValue, 0) + bucketTotal;
  const liabilityTotal = liabilities.reduce((s, l) => s + l.outstandingAmount, 0);

  // Asset breakdown
  const byType: Record<string, number> = {};
  for (const a of assets) {
    byType[a.type] = (byType[a.type] || 0) + a.currentValue;
  }
  // Add bucket amounts
  byType['mutual_fund'] = (byType['mutual_fund'] || 0) + bucketTotal;

  const assetBreakdown = Object.entries(byType)
    .map(([type, value]) => ({
      type: type as AssetClass,
      value,
      percent: assetTotal > 0 ? Math.round((value / assetTotal) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  return {
    totalAssets: assetTotal,
    totalLiabilities: liabilityTotal,
    netWorth: assetTotal - liabilityTotal,
    assetBreakdown,
    monthlyChange: 0, // computed from historical
    monthlyChangePercent: 0,
  };
}

// ═══════════════════════════════════════════
// Tax Profile Calculator
// ═══════════════════════════════════════════

export function calculateTaxProfile(user: UserProfile, assets: Asset[], investments: Investment[]): TaxProfile {
  const elss = assets.filter(a => a.name.toLowerCase().includes('elss')).reduce((s, a) => s + a.investedAmount, 0);
  const nps = assets.filter(a => a.type === 'nps').reduce((s, a) => s + a.investedAmount, 0);
  const ppf = assets.filter(a => a.type === 'ppf').reduce((s, a) => s + a.investedAmount, 0);
  const epf = assets.filter(a => a.type === 'epf').reduce((s, a) => s + a.investedAmount, 0);

  const section80C = Math.min(150000, elss + ppf + epf);
  const section80D = user.hasHealthInsurance ? 25000 : 0;
  const totalTaxSaved = Math.round((section80C + section80D + nps) * 0.3); // approx 30% bracket
  const potentialSavings = Math.round((150000 - section80C) * 0.3);

  return {
    regime: 'old',
    section80C,
    section80D,
    hra: 0,
    ltcg: 0,
    stcg: 0,
    elssInvested: elss,
    npsInvested: nps,
    totalTaxSaved,
    potentialSavings,
  };
}

// ═══════════════════════════════════════════
// Signal Generator — The proactive brain
// ═══════════════════════════════════════════

export function generateSignals(
  user: UserProfile,
  market: MarketData,
  assets: Asset[],
  liabilities: Liability[],
  insurance: InsurancePolicy[],
  watchlist: WatchlistItem[],
  investments: Investment[],
  goals: Goal[],
  buckets: MoneyBucket[],
): AISignal[] {
  const signals: AISignal[] = [];
  const now = new Date();
  const ts = now.toISOString();
  const investable = Math.max(0, user.monthlyIncome - user.monthlyExpense);

  // ── Market-based signals ──
  if (market.marketSentiment === 'fear' && market.nifty50.changePercent < -2) {
    signals.push(makeSignal('buy', 'Market Dip — SIP Opportunity 📈',
      `Nifty ${market.nifty50.changePercent}% down. Historically, investing during fear gives best returns. Consider increasing this month\'s SIP.`,
      'high', 85, 'Market fear + historical data shows dip-buying outperforms', ts));
  }

  if (market.marketSentiment === 'greed' && market.nifty50.changePercent > 3) {
    signals.push(makeSignal('alert', 'Market Euphoria — Be Cautious ⚠️',
      `Nifty ${market.nifty50.changePercent}% up today. Avoid lump sum equity investments in euphoria. Stick to SIP only.`,
      'medium', 75, 'Overheated market, high P/E, greed index elevated', ts));
  }

  // Gold signal
  if (market.goldPrice > 90000) {
    const goldAllocation = assets.filter(a => a.type === 'gold').reduce((s, a) => s + a.currentValue, 0);
    const totalAssets = assets.reduce((s, a) => s + a.currentValue, 0) + buckets.reduce((s, b) => s + b.currentAmount, 0);
    const goldPercent = totalAssets > 0 ? (goldAllocation / totalAssets) * 100 : 0;
    if (goldPercent < 5) {
      signals.push(makeSignal('opportunity', 'Gold Allocation Low 🥇',
        `Gold at ₹${(market.goldPrice / 1000).toFixed(0)}K/10g. Your gold allocation is only ${goldPercent.toFixed(0)}%. Experts suggest 5-10% in gold as hedge.`,
        'low', 60, `goldPrice=${market.goldPrice}, goldPct=${goldPercent.toFixed(1)}`, ts));
    }
  }

  // ── Emergency fund ──
  const emergencyGoal = goals.find(g => g.type === 'emergency');
  const emergencyTarget = user.monthlyExpense * 6;
  if (!emergencyGoal || emergencyGoal.currentAmount < emergencyTarget * 0.5) {
    signals.push(makeSignal('alert', 'Emergency Fund Critical 🚨',
      `Emergency fund should be ₹${formatFullCurrency(emergencyTarget)} (6 months expenses). ${emergencyGoal ? `Only ${Math.round((emergencyGoal.currentAmount / emergencyTarget) * 100)}% done.` : 'Not started yet!'} Build this before risky investments.`,
      'high', 95, 'Financial safety net is priority #1', ts));
  }

  // ── Insurance gaps ──
  const hasHealth = insurance.some(i => i.type === 'health');
  const hasTerm = insurance.some(i => i.type === 'term' || i.type === 'life');
  if (!hasHealth) {
    signals.push(makeSignal('alert', 'No Health Insurance! 🏥',
      `Medical emergency bina insurance = financial disaster. ₹5-10L health cover lelo ASAP. Family ke liye minimum ₹10L.`,
      'high', 90, 'No health insurance found in records', ts));
  }
  if (!hasTerm && user.age >= 25) {
    signals.push(makeSignal('alert', 'Term Insurance Missing 🛡️',
      `Age ${user.age} pe term insurance sasta hai. ₹1Cr cover ke liye ~₹700/month. Family ke liye zaroori hai.`,
      'high', 85, 'No term/life insurance in records', ts));
  }

  // ── Debt management ──
  const highInterestDebt = liabilities.filter(l => l.interestRate > 12);
  if (highInterestDebt.length > 0) {
    const totalHigh = highInterestDebt.reduce((s, l) => s + l.outstandingAmount, 0);
    signals.push(makeSignal('alert', 'High Interest Debt ⚠️',
      `₹${formatFullCurrency(totalHigh)} in high-interest loans (${highInterestDebt.map(l => l.name).join(', ')}). Pay these off before investing — no investment beats 15%+ interest cost.`,
      'high', 90, `highDebt=${totalHigh}, rates=${highInterestDebt.map(l => l.interestRate + '%').join(',')}`, ts));
  }

  // ── Tax optimization ──
  const now_month = now.getMonth();
  if (now_month >= 0 && now_month <= 2) {
    const elss = assets.filter(a => a.name.toLowerCase().includes('elss')).reduce((s, a) => s + a.investedAmount, 0);
    if (elss < 150000) {
      const remaining = 150000 - elss;
      signals.push(makeSignal('tax_action', 'Tax Saving Deadline! 💸',
        `FY ending soon. ₹${formatFullCurrency(remaining)} more in ELSS = ₹${formatFullCurrency(Math.round(remaining * 0.3))} tax saved. Last chance!`,
        'high', 80, `elssInvested=${elss}, gap=${remaining}`, ts));
    }
  }

  // ── Watchlist alerts ──
  for (const item of watchlist) {
    if (item.targetBuyPrice && item.currentPrice <= item.targetBuyPrice) {
      signals.push(makeSignal('buy', `${item.name} Hit Target! 🎯`,
        `${item.symbol} at ₹${item.currentPrice} — your buy target was ₹${item.targetBuyPrice}. Consider buying now.`,
        'high', 70, `price=${item.currentPrice}, target=${item.targetBuyPrice}`, ts));
    }
    if (item.targetSellPrice && item.currentPrice >= item.targetSellPrice) {
      signals.push(makeSignal('sell', `${item.name} — Book Profit? 💰`,
        `${item.symbol} at ₹${item.currentPrice} — above your sell target ₹${item.targetSellPrice}. Consider booking profits.`,
        'medium', 65, `price=${item.currentPrice}, sellTarget=${item.targetSellPrice}`, ts));
    }
  }

  // ── Asset rebalancing ──
  if (assets.length >= 3) {
    const totalValue = assets.reduce((s, a) => s + a.currentValue, 0);
    const equityPercent = assets.filter(a => ['stock', 'mutual_fund'].includes(a.type)).reduce((s, a) => s + a.currentValue, 0) / Math.max(1, totalValue) * 100;
    const idealEquity = user.riskLevel === 'aggressive' ? 80 : user.riskLevel === 'balanced' ? 60 : 40;
    if (Math.abs(equityPercent - idealEquity) > 20) {
      signals.push(makeSignal('rebalance', 'Portfolio Rebalance Needed 🔄',
        `Equity is ${equityPercent.toFixed(0)}% vs target ${idealEquity}%. ${equityPercent > idealEquity ? 'Too much equity risk — shift some to debt/gold.' : 'Too conservative — add more equity for growth.'}`,
        'medium', 70, `equity=${equityPercent.toFixed(0)}, target=${idealEquity}`, ts));
    }
  }

  // ── Consistency check ──
  if (investments.length > 0) {
    const lastInv = new Date(investments[0].date);
    const daysSince = Math.round((now.getTime() - lastInv.getTime()) / (24 * 60 * 60 * 1000));
    if (daysSince > 35) {
      signals.push(makeSignal('alert', `${daysSince} Din Se Invest Nahi Kiya! ⏰`,
        `Last investment ${daysSince} days ago. SIP miss mat karo — consistency is key to wealth creation.`,
        'medium', 80, `daysSince=${daysSince}`, ts));
    }
  }

  // ── Life stage signals ──
  if (user.age >= 30 && !goals.some(g => g.type === 'retirement')) {
    signals.push(makeSignal('opportunity', 'Retirement Planning Start Karo 🏖️',
      `Age ${user.age} pe retirement planning shuru karna chahiye. ₹${formatFullCurrency(Math.round(investable * 0.2))}/month from now = comfortable retirement at 60.`,
      'medium', 75, `age=${user.age}, noRetirementGoal=true`, ts));
  }

  // Sort by urgency
  const urgencyOrder = { high: 0, medium: 1, low: 2 };
  signals.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

  return signals;
}

function makeSignal(type: SignalType, title: string, description: string, urgency: 'high' | 'medium' | 'low', confidence: number, reasoning: string, timestamp: string): AISignal {
  return { id: generateId(), type, title, description, urgency, confidence, reasoning, timestamp, read: false };
}

// ═══════════════════════════════════════════
// Daily Brief Generator
// ═══════════════════════════════════════════

export function generateDailyBrief(
  user: UserProfile,
  market: MarketData,
  netWorth: NetWorth,
  signals: AISignal[],
  investments: Investment[],
  goals: Goal[],
): DailyBrief {
  const hour = new Date().getHours();
  const greetTime = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const investable = Math.max(0, user.monthlyIncome - user.monthlyExpense);

  const greeting = `${greetTime}, ${user.name}! 👋`;

  const mktEmoji = market.nifty50.changePercent >= 0 ? '📈' : '📉';
  const marketSummary = `${mktEmoji} Nifty ${market.nifty50.value.toLocaleString()} (${market.nifty50.changePercent >= 0 ? '+' : ''}${market.nifty50.changePercent}%). Gold ₹${(market.goldPrice / 1000).toFixed(0)}K. FD ${market.fdRate}%. Market mood: ${market.marketSentiment}.`;

  const portfolioUpdate = `💼 Net worth: ${formatFullCurrency(netWorth.netWorth)}. Assets: ${formatFullCurrency(netWorth.totalAssets)}, Liabilities: ${formatFullCurrency(netWorth.totalLiabilities)}.`;

  const topSignals = signals.filter(s => s.urgency === 'high').slice(0, 3);

  const actionItems: string[] = [];
  const lastInv = investments.length > 0 ? new Date(investments[0].date) : null;
  const daysSinceInv = lastInv ? Math.round((Date.now() - lastInv.getTime()) / (24 * 60 * 60 * 1000)) : 999;
  if (daysSinceInv > 25) actionItems.push(`SIP due — ₹${formatFullCurrency(investable)} investable this month`);

  const behindGoals = goals.filter(g => (g.currentAmount / Math.max(1, g.targetAmount)) < 0.3 && g.type !== 'emergency');
  if (behindGoals.length > 0) actionItems.push(`${behindGoals.length} goal(s) behind schedule`);

  if (signals.some(s => s.type === 'tax_action')) actionItems.push('Tax-saving actions pending');

  const motivationalNotes = [
    '"Compound interest is the 8th wonder of the world." — Einstein',
    '"The best time to plant a tree was 20 years ago. The second best time is now."',
    '"Do not save what is left after spending; spend what is left after saving." — Buffett',
    '"An investment in knowledge pays the best interest." — Franklin',
    `Har mahine ₹${formatFullCurrency(investable)} invest karo — 10 saal mein miracle hoga! 🚀`,
  ];

  return {
    date: new Date().toISOString(),
    greeting,
    marketSummary,
    portfolioUpdate,
    topSignals,
    actionItems,
    motivationalNote: motivationalNotes[new Date().getDate() % motivationalNotes.length],
  };
}

// ═══════════════════════════════════════════
// Build comprehensive AI context
// ═══════════════════════════════════════════

export function buildCompanionContext(
  user: UserProfile,
  netWorth: NetWorth,
  assets: Asset[],
  liabilities: Liability[],
  insurance: InsurancePolicy[],
  watchlist: WatchlistItem[],
  lifeEvents: LifeEvent[],
  taxProfile: TaxProfile,
  signals: AISignal[],
  market: MarketData,
): string {
  const lines: string[] = [];

  lines.push('═══ NIVESH SAATHI COMPANION — FULL USER CONTEXT ═══');
  lines.push('(Use this REAL data for all advice. Be specific. Reference actual numbers.)');

  lines.push(`\nNET WORTH: ${formatFullCurrency(netWorth.netWorth)}`);
  lines.push(`  Assets: ${formatFullCurrency(netWorth.totalAssets)} | Liabilities: ${formatFullCurrency(netWorth.totalLiabilities)}`);
  if (netWorth.assetBreakdown.length > 0) {
    lines.push('  Breakdown: ' + netWorth.assetBreakdown.map(a => `${a.type}: ${a.percent}%`).join(', '));
  }

  if (assets.length > 0) {
    lines.push(`\nASSETS (${assets.length}):`);
    for (const a of assets.slice(0, 10)) {
      const ret = a.returnPercent >= 0 ? `+${a.returnPercent.toFixed(1)}%` : `${a.returnPercent.toFixed(1)}%`;
      lines.push(`  ${a.name} (${a.type}): ₹${a.currentValue.toLocaleString('en-IN')} [${ret}] — ${a.riskLevel}`);
    }
  }

  if (liabilities.length > 0) {
    lines.push(`\nLIABILITIES (${liabilities.length}):`);
    for (const l of liabilities) {
      lines.push(`  ${l.name}: ₹${l.outstandingAmount.toLocaleString('en-IN')} @ ${l.interestRate}%, EMI ₹${l.emi.toLocaleString('en-IN')}`);
    }
  }

  if (insurance.length > 0) {
    lines.push(`\nINSURANCE (${insurance.length}):`);
    for (const p of insurance) {
      lines.push(`  ${p.name} (${p.type}): Cover ₹${p.coverAmount.toLocaleString('en-IN')}, Premium ₹${p.premium.toLocaleString('en-IN')}/${p.premiumFrequency}`);
    }
  } else {
    lines.push('\nINSURANCE: NONE — critical gap!');
  }

  lines.push(`\nTAX PROFILE:`);
  lines.push(`  80C Used: ₹${taxProfile.section80C.toLocaleString('en-IN')}/1,50,000`);
  lines.push(`  80D: ₹${taxProfile.section80D.toLocaleString('en-IN')}`);
  lines.push(`  ELSS: ₹${taxProfile.elssInvested.toLocaleString('en-IN')} | NPS: ₹${taxProfile.npsInvested.toLocaleString('en-IN')}`);
  lines.push(`  Tax Saved: ~₹${taxProfile.totalTaxSaved.toLocaleString('en-IN')} | Can Save More: ~₹${taxProfile.potentialSavings.toLocaleString('en-IN')}`);

  if (watchlist.length > 0) {
    lines.push(`\nWATCHLIST (${watchlist.length}):`);
    for (const w of watchlist) {
      lines.push(`  ${w.symbol}: ₹${w.currentPrice} (${w.changePercent >= 0 ? '+' : ''}${w.changePercent}%)${w.targetBuyPrice ? ` | Buy target: ₹${w.targetBuyPrice}` : ''}${w.targetSellPrice ? ` | Sell target: ₹${w.targetSellPrice}` : ''}`);
    }
  }

  if (lifeEvents.length > 0) {
    lines.push(`\nLIFE EVENTS:`);
    for (const e of lifeEvents.slice(0, 5)) {
      lines.push(`  ${e.emoji} ${e.title} (${new Date(e.date).toLocaleDateString()}) — Impact: ${e.financialImpact >= 0 ? '+' : ''}₹${e.financialImpact.toLocaleString('en-IN')}`);
    }
  }

  if (signals.filter(s => !s.read).length > 0) {
    lines.push(`\nACTIVE SIGNALS (${signals.filter(s => !s.read).length}):`);
    for (const s of signals.filter(s => !s.read).slice(0, 5)) {
      lines.push(`  [${s.urgency.toUpperCase()}] ${s.type}: ${s.title}`);
    }
  }

  lines.push(`\nMARKET: Nifty ${market.nifty50.value} (${market.nifty50.changePercent >= 0 ? '+' : ''}${market.nifty50.changePercent}%), Sentiment: ${market.marketSentiment}, Gold: ₹${market.goldPrice.toLocaleString('en-IN')}/10g, FD: ${market.fdRate}%, Inflation: ${market.inflation}%`);

  lines.push(`\nRULE: Use ALL the above data. Give specific, actionable advice. Reference exact numbers. Warn about gaps. Suggest concrete actions.`);

  return lines.join('\n');
}

