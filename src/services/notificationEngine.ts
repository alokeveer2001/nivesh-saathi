/**
 * Proactive Notification Service
 *
 * Generates AI-powered, context-aware notifications throughout the day.
 * Specific fund names, exact amounts, buy/sell levels.
 *
 * Uses OpenAI when available for hyper-personalized signals,
 * falls back to smart data-driven notifications.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, Investment, Goal, MoneyBucket, Asset, AISignal } from '../types';
import { getApiKey } from './apiKeyStore';
import { MarketData } from './marketIntelligence';
import { generateId, formatFullCurrency } from '../utils/helpers';

const NOTIF_KEY = '@nivesh_notifications';

export interface ProactiveNotification {
  id: string;
  type: 'sector_pick' | 'market_alert' | 'sip_reminder' | 'spend_warning' | 'opportunity' | 'learning' | 'goal_update' | 'ai_insight';
  title: string;
  body: string;
  detail?: string;
  emoji: string;
  urgency: 'high' | 'medium' | 'low';
  timestamp: string;
  read: boolean;
  actionLabel?: string;
  actionRoute?: string;
}

// ═══════════════════════════════════════════
// Persistence
// ═══════════════════════════════════════════

export async function loadNotifications(): Promise<ProactiveNotification[]> {
  try {
    const d = await AsyncStorage.getItem(NOTIF_KEY);
    return d ? JSON.parse(d) : [];
  } catch { return []; }
}

export async function saveNotifications(notifs: ProactiveNotification[]) {
  await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(notifs.slice(0, 100)));
}

export async function markNotifRead(id: string) {
  const all = await loadNotifications();
  await saveNotifications(all.map(n => n.id === id ? { ...n, read: true } : n));
}

export async function markAllRead() {
  const all = await loadNotifications();
  await saveNotifications(all.map(n => ({ ...n, read: true })));
}

// ═══════════════════════════════════════════
// Main Generator — ALWAYS generates fresh on refresh
// ═══════════════════════════════════════════

export async function generateAINotifications(
  user: UserProfile,
  market: MarketData,
  investments: Investment[],
  goals: Goal[],
  buckets: MoneyBucket[],
  assets: Asset[],
  signals: AISignal[],
  forceRefresh: boolean = false,
): Promise<ProactiveNotification[]> {
  const ts = new Date().toISOString();
  const investable = Math.max(0, user.monthlyIncome - user.monthlyExpense);
  const totalInvested = buckets.reduce((s, b) => s + b.currentAmount, 0) + assets.reduce((s, a) => s + a.currentValue, 0);

  const newNotifs: ProactiveNotification[] = [];

  // ── AI sector picks (always fresh on refresh) ──
  const aiPicks = await generateAISectorPicks(user, market, assets, investments, totalInvested, investable);
  if (aiPicks) {
    newNotifs.push(...aiPicks);
  } else {
    newNotifs.push(...generateSpecificPicks(user, market, assets, investable, totalInvested));
  }

  // ── Specific market alert ──
  newNotifs.push(generateMarketAlert(market, ts));

  // ── SIP / investment reminder ──
  const sipNotif = generateSIPReminder(user, investments, investable, ts);
  if (sipNotif) newNotifs.push(sipNotif);

  // ── Goal alerts ──
  for (const g of goals) {
    const pct = g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0;
    if (pct >= 90 && pct < 100) {
      newNotifs.push(makeNotif('goal_update', `${g.emoji} ${g.name} — ${pct}% Done!`,
        `Bas ₹${formatFullCurrency(g.targetAmount - g.currentAmount)} baaki. Ek aur month SIP karo!`,
        '🎉', 'medium', ts));
    }
  }

  // ── Opportunity signals ──
  for (const sig of signals.filter(s => s.urgency === 'high').slice(0, 2)) {
    newNotifs.push(makeNotif('opportunity', sig.title, sig.description,
      sig.type === 'buy' ? '📈' : '⚠️', 'high', ts));
  }

  // ── Portfolio-specific alerts ──
  const portfolioAlerts = generatePortfolioAlerts(user, assets, buckets, totalInvested, market, ts);
  newNotifs.push(...portfolioAlerts);

  // ── AI market insight ──
  const aiInsight = await generateAIMarketInsight(user, market, investments, assets, investable);
  if (aiInsight) newNotifs.push(aiInsight);

  // ── Learning tip ──
  newNotifs.push(generateLearningTip(user, ts));

  // Merge: new on top, keep old below (deduped by type+date)
  const todayDate = ts.slice(0, 10);
  const existing = await loadNotifications();
  // Remove today's old notifications of same types to avoid duplicates
  const oldKept = existing.filter(n => n.timestamp.slice(0, 10) !== todayDate);
  const merged = [...newNotifs, ...oldKept].slice(0, 100);
  await saveNotifications(merged);

  return merged;
}

// ═══════════════════════════════════════════
// AI Sector Picks — Specific, actionable
// ═══════════════════════════════════════════

async function generateAISectorPicks(
  user: UserProfile, market: MarketData, assets: Asset[],
  investments: Investment[], totalInvested: number, investable: number,
): Promise<ProactiveNotification[] | null> {
  try {
    const apiKey = await getApiKey();
    if (!apiKey) return null;

    const assetSummary = assets.length > 0
      ? assets.map(a => `${a.name}(${a.type},₹${a.currentValue},${a.returnPercent >= 0 ? '+' : ''}${a.returnPercent.toFixed(0)}%)`).join('; ')
      : 'No tracked assets';

    const recentInv = investments.slice(0, 5).map(i => `₹${i.amount} in ${i.bucket} on ${i.date.slice(0, 10)}`).join('; ');

    const prompt = `You are an expert Indian investment advisor giving SPECIFIC actionable picks for today.

TODAY'S MARKET DATA:
- Nifty 50: ${market.nifty50.value} (${market.nifty50.changePercent >= 0 ? '+' : ''}${market.nifty50.changePercent}%)
- Market Sentiment: ${market.marketSentiment.toUpperCase()}
- Gold: ₹${market.goldPrice.toLocaleString('en-IN')}/10g
- FD Rate: ${market.fdRate}% | Inflation: ${market.inflation}%
- Real returns on FD: ${(market.fdRate - market.inflation).toFixed(1)}%

USER PROFILE:
- ${user.name}, Age ${user.age}, Risk: ${user.riskLevel}
- Monthly investable: ₹${investable.toLocaleString('en-IN')}
- Total portfolio: ₹${totalInvested.toLocaleString('en-IN')}
- Current assets: ${assetSummary}
- Recent investments: ${recentInv || 'None yet'}

Generate EXACTLY 4 investment recommendations. Be VERY SPECIFIC:
- Name exact mutual fund schemes, ETFs, or stock names (Indian market)
- Give specific amount to invest based on user's ₹${investable.toLocaleString('en-IN')}/month
- Give buy/sell/hold signal with clear reasoning
- Include risk warning where applicable

Format as JSON array:
[{
  "name": "exact fund/stock name",
  "action": "BUY/SELL/HOLD/ACCUMULATE/AVOID",
  "amount": "₹X,XXX (XX% of monthly investable)",
  "reason": "specific 1-line reasoning with data",
  "risk": "Low/Medium/High",
  "timeframe": "e.g. 3+ years, immediate, this month"
}]

IMPORTANT: Only return the JSON array. No other text. Use real Indian fund/stock names.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
        temperature: 0.75,
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) return null;

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return null;
    const picks = JSON.parse(jsonMatch[0]);

    const ts = new Date().toISOString();
    const actionEmojis: Record<string, string> = { BUY: '🟢 BUY', SELL: '🔴 SELL', HOLD: '✋ HOLD', ACCUMULATE: '🟡 ACCUMULATE', AVOID: '⛔ AVOID', WATCH: '👁️ WATCH' };

    return picks.map((p: any) => makeNotif(
      'sector_pick',
      `${actionEmojis[p.action] || p.action} — ${p.name}`,
      `${p.reason}\n💰 ${p.amount} | ⏱️ ${p.timeframe}`,
      p.action === 'BUY' || p.action === 'ACCUMULATE' ? '📈' : p.action === 'SELL' ? '📉' : '👁️',
      p.risk === 'High' ? 'high' : p.risk === 'Low' ? 'low' : 'medium',
      ts,
      `Risk: ${p.risk} | Personalized for your ${user.riskLevel} profile with ₹${investable.toLocaleString('en-IN')}/mo investable`,
    ));
  } catch (e) {
    console.log('AI sector picks failed:', e);
    return null;
  }
}

// ═══════════════════════════════════════════
// AI Market Insight — personalized daily take
// ═══════════════════════════════════════════

async function generateAIMarketInsight(
  user: UserProfile, market: MarketData, investments: Investment[],
  assets: Asset[], investable: number,
): Promise<ProactiveNotification | null> {
  try {
    const apiKey = await getApiKey();
    if (!apiKey) return null;

    const lastInvDays = investments.length > 0
      ? Math.round((Date.now() - new Date(investments[0].date).getTime()) / 86400000)
      : 999;
    const assetTypes = [...new Set(assets.map(a => a.type))].join(', ') || 'none';

    const prompt = `You are Nivesh Saathi, a personal AI investment companion for ${user.name}.

Context: Nifty ${market.nifty50.value} (${market.nifty50.changePercent >= 0 ? '+' : ''}${market.nifty50.changePercent}%), sentiment=${market.marketSentiment}, gold=₹${market.goldPrice}, inflation=${market.inflation}%.
User: Age ${user.age}, risk=${user.riskLevel}, investable=₹${investable.toLocaleString('en-IN')}/mo, last invested ${lastInvDays} days ago, holds: ${assetTypes}.

Give a 3-line personalized briefing in Hinglish (Hindi+English mix):
Line 1: What happened in market today and what it means for them specifically
Line 2: One specific action they should take TODAY with exact amount
Line 3: One risk/opportunity they should watch this week

Be direct, specific, use their actual numbers. Max 80 words total. Use 2-3 emojis.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.8,
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) return null;

    return makeNotif('ai_insight', '🤖 Saathi Daily Take', text, '🤖', 'medium', new Date().toISOString());
  } catch { return null; }
}

// ═══════════════════════════════════════════
// Portfolio-specific alerts
// ═══════════════════════════════════════════

function generatePortfolioAlerts(
  user: UserProfile, assets: Asset[], buckets: MoneyBucket[],
  totalInvested: number, market: MarketData, ts: string,
): ProactiveNotification[] {
  const alerts: ProactiveNotification[] = [];

  // Check asset concentration
  if (assets.length > 0) {
    const byType: Record<string, number> = {};
    for (const a of assets) byType[a.type] = (byType[a.type] || 0) + a.currentValue;
    const totalAssets = Object.values(byType).reduce((s, v) => s + v, 0);
    for (const [type, value] of Object.entries(byType)) {
      const pct = totalAssets > 0 ? (value / totalAssets) * 100 : 0;
      if (pct > 60) {
        alerts.push(makeNotif('spend_warning', `⚠️ ${type} Concentration: ${pct.toFixed(0)}%`,
          `Portfolio ka ${pct.toFixed(0)}% sirf ${type} mein hai. Diversify karo — max 40% ek asset class mein rakhein.`,
          '⚠️', 'high', ts));
      }
    }

    // Check for underperforming assets
    const underperformers = assets.filter(a => a.returnPercent < -10);
    if (underperformers.length > 0) {
      const worst = underperformers.sort((a, b) => a.returnPercent - b.returnPercent)[0];
      alerts.push(makeNotif('opportunity', `📉 ${worst.name}: ${worst.returnPercent.toFixed(1)}% down`,
        `${worst.name} significantly underperforming. Review karo — exit ya average down? Invested: ₹${formatFullCurrency(worst.investedAmount)}, Current: ₹${formatFullCurrency(worst.currentValue)}.`,
        '📉', 'medium', ts));
    }

    // Top performer
    const topPerformer = [...assets].sort((a, b) => b.returnPercent - a.returnPercent)[0];
    if (topPerformer && topPerformer.returnPercent > 20) {
      alerts.push(makeNotif('opportunity', `🏆 Top: ${topPerformer.name} +${topPerformer.returnPercent.toFixed(1)}%`,
        `Best performer! Profit: ₹${formatFullCurrency(topPerformer.returns)}. Consider partial profit booking if > 30% of portfolio.`,
        '🏆', 'low', ts));
    }
  }

  // Bucket imbalance
  const safeB = buckets.find(b => b.id === 'safe');
  const growthB = buckets.find(b => b.id === 'growth');
  if (safeB && growthB && totalInvested > 0) {
    const safePct = (safeB.currentAmount / totalInvested) * 100;
    if (user.riskLevel === 'aggressive' && safePct > 50) {
      alerts.push(makeNotif('opportunity', '💡 Too Safe for Aggressive Profile',
        `${safePct.toFixed(0)}% safe mein hai but risk profile aggressive hai. ₹${formatFullCurrency(Math.round(safeB.currentAmount * 0.3))} growth mein shift karo for better returns.`,
        '💡', 'medium', ts));
    }
    if (user.riskLevel === 'safe' && safePct < 30) {
      alerts.push(makeNotif('spend_warning', '⚠️ Risky Allocation for Safe Profile',
        `Safe pocket sirf ${safePct.toFixed(0)}%. Risk profile ke hisaab se min 50% safe mein hona chahiye. Rebalance karo.`,
        '⚠️', 'high', ts));
    }
  }

  // Gold allocation check
  if (market.goldPrice > 85000 && totalInvested > 50000) {
    const goldAssets = assets.filter(a => a.type === 'gold').reduce((s, a) => s + a.currentValue, 0);
    const goldPct = (goldAssets / totalInvested) * 100;
    if (goldPct < 3) {
      alerts.push(makeNotif('opportunity', '🥇 Add Gold to Portfolio',
        `Gold allocation ${goldPct.toFixed(0)}% — experts suggest 5-10%. ₹${formatFullCurrency(Math.round(totalInvested * 0.05))} in Nippon Gold BeES or SGB consider karo.`,
        '🥇', 'low', ts));
    }
  }

  return alerts;
}

// ═══════════════════════════════════════════
// Specific rule-based picks (when no API key)
// ═══════════════════════════════════════════

function generateSpecificPicks(
  user: UserProfile, market: MarketData, assets: Asset[],
  investable: number, totalInvested: number,
): ProactiveNotification[] {
  const ts = new Date().toISOString();
  const picks: ProactiveNotification[] = [];
  const sipAmt = Math.round(investable * 0.3);
  const sipSmall = Math.round(investable * 0.15);

  if (market.marketSentiment === 'fear') {
    picks.push(makeNotif('sector_pick',
      '🟢 BUY — UTI Nifty 50 Index Fund',
      `Market fear zone = best entry. Start SIP ₹${formatFullCurrency(sipAmt)}/month. Nifty has recovered from every crash in history. 12-15% CAGR expected over 5+ years.`,
      '📈', 'high', ts, `Expense ratio: 0.18% | Category: Large Cap Index | Min SIP: ₹500 | Your allocation: ${((sipAmt / investable) * 100).toFixed(0)}% of investable`));

    picks.push(makeNotif('sector_pick',
      '🟢 BUY — HDFC Corporate Bond Fund',
      `Safe haven in volatile market. Put ₹${formatFullCurrency(sipSmall)}/month. 7.5-8% returns, low volatility. Good for emergency corpus.`,
      '🏦', 'low', ts, 'Category: Debt Fund | AAA-rated bonds | Better than FD post-tax'));

    picks.push(makeNotif('sector_pick',
      '🟡 ACCUMULATE — SBI Banking & PSU Fund',
      `Banking correction = opportunity. ₹${formatFullCurrency(sipSmall)}/month. PSU banks valuations attractive at 0.8-1.2x book value.`,
      '🏦', 'medium', ts, 'Sector bet | Only if you have core equity already | 3+ year horizon'));

    picks.push(makeNotif('sector_pick',
      '👁️ WATCH — Kotak Gold ETF',
      `Gold ₹${(market.goldPrice / 1000).toFixed(0)}K/10g. If portfolio gold < 5%, add ₹${formatFullCurrency(Math.round(investable * 0.1))}/month. Safe haven hedge.`,
      '🥇', 'low', ts, 'Hedge allocation | Not for growth | 5-10% of total portfolio'));
  } else if (market.marketSentiment === 'greed') {
    picks.push(makeNotif('sector_pick',
      '⛔ AVOID — Lump Sum in Small Caps',
      `Market overheated. P/E elevated. Do NOT put lump sum in small/mid caps now. Only continue existing SIPs.`,
      '⚠️', 'high', ts, 'Small cap index P/E above historical average | Wait for 10-15% correction'));

    picks.push(makeNotif('sector_pick',
      '🟢 BUY — Parag Parikh Flexi Cap Fund',
      `SIP only mode. ₹${formatFullCurrency(sipAmt)}/month. Diversified India+US exposure. PPFAS has consistently outperformed in all market cycles.`,
      '📈', 'medium', ts, 'AUM: ₹70K Cr+ | Expense: 0.63% | 5Y return: ~18% CAGR'));

    picks.push(makeNotif('sector_pick',
      '🟢 BUY — ICICI Pru Liquid Fund',
      `Build war chest ₹${formatFullCurrency(sipAmt)} for next correction. 7-7.5% returns, instant redemption. Be ready to deploy when market dips.`,
      '🏦', 'low', ts, 'Park cash here | Deploy into equity on 10%+ correction'));

    picks.push(makeNotif('sector_pick',
      '✋ HOLD — Existing Equity Positions',
      `Don't panic sell, don't add aggressively. SIPs continue, no new lump sums. Book partial profits if any stock > 50% up.`,
      '✋', 'medium', ts, 'Profit booking rule: Sell 30% when position doubles'));
  } else {
    // Neutral market
    picks.push(makeNotif('sector_pick',
      `🟢 BUY — Motilal Oswal Nifty 50 Index Fund`,
      `Best time for consistent SIP. ₹${formatFullCurrency(sipAmt)}/month. 12% CAGR over 20 years. Lowest cost way to own India's top 50.`,
      '📊', 'low', ts, 'Expense: 0.1% | Direct plan | Set auto-debit for discipline'));

    if (user.riskLevel !== 'safe') {
      picks.push(makeNotif('sector_pick',
        '🟢 BUY — HDFC Mid Cap Opportunities Fund',
        `Mid caps fair valued now. ₹${formatFullCurrency(sipSmall)}/month for high growth. Best mid cap fund by consistency.`,
        '📈', 'medium', ts, '5Y CAGR: ~20% | Only for 5+ year horizon | Max 20% of equity allocation'));
    } else {
      picks.push(makeNotif('sector_pick',
        '🟢 BUY — HDFC Short Term Debt Fund',
        `Safe & steady. ₹${formatFullCurrency(sipSmall)}/month. 7.5-8% returns, much better than savings account. No market risk.`,
        '🔒', 'low', ts, '1-3 year ideal | Low volatility | Better than FD for > 3 years'));
    }

    picks.push(makeNotif('sector_pick',
      '🟡 ACCUMULATE — Mirae Asset ELSS Tax Saver',
      `Save tax + grow wealth. ₹${formatFullCurrency(Math.min(sipSmall, 12500))}/month under 80C. 3 year lock-in but best tax-saving MF.`,
      '💸', 'medium', ts, 'Max ₹1.5L/year for 80C | 3Y lock-in | ~15% historical CAGR'));

    picks.push(makeNotif('sector_pick',
      user.age < 35 ? '🟢 BUY — Quant Small Cap Fund' : '👁️ WATCH — Small Caps',
      user.age < 35
        ? `Young age = high risk capacity. ₹${formatFullCurrency(Math.round(investable * 0.1))}/month in small caps. High volatility but 20%+ CAGR potential.`
        : `Small caps risky at age ${user.age}. Only allocate 5-10% max. SIP mode only, not lump sum.`,
      user.age < 35 ? '🚀' : '👁️', user.age < 35 ? 'medium' : 'low', ts,
      'Very high risk | 7+ year horizon | Can drop 40-50% in corrections'));
  }

  return picks;
}

// ═══════════════════════════════════════════
// Market alert
// ═══════════════════════════════════════════

function generateMarketAlert(market: MarketData, ts: string): ProactiveNotification {
  const chg = market.nifty50.changePercent;
  const realFD = (market.fdRate - market.inflation).toFixed(1);

  if (chg < -2) {
    return makeNotif('market_alert',
      `📉 Market Crash Alert: Nifty ${market.nifty50.value.toLocaleString()} (${chg}%)`,
      `Sharp fall today! DON'T PANIC. SIP investors: this is GOOD — you get more units at lower price. Add extra ₹ if possible. Fear = opportunity.`,
      '📉', 'high', ts, `Nifty P/E likely compressed | Real FD return only ${realFD}% — equity still better for 5Y+`);
  } else if (chg > 2) {
    return makeNotif('market_alert',
      `📈 Big Rally: Nifty ${market.nifty50.value.toLocaleString()} (+${chg}%)`,
      `Strong rally! Don't FOMO into buying. Stick to SIP plan. If holding profits > 30%, consider booking 20-30% gains.`,
      '📈', 'medium', ts, `Euphoria warning | Continue SIPs normally | Don't add lump sum today`);
  } else {
    return makeNotif('market_alert',
      `➡️ Market Steady: Nifty ${market.nifty50.value.toLocaleString()} (${chg >= 0 ? '+' : ''}${chg}%)`,
      `Stable day. Perfect environment for SIPs. Gold ₹${(market.goldPrice / 1000).toFixed(0)}K. FD real return ${realFD}% — equity wins long-term.`,
      '➡️', 'low', ts);
  }
}

// ═══════════════════════════════════════════
// SIP Reminder
// ═══════════════════════════════════════════

function generateSIPReminder(user: UserProfile, investments: Investment[], investable: number, ts: string): ProactiveNotification | null {
  if (investments.length === 0) {
    return makeNotif('sip_reminder', '🚀 Start Your First Investment!',
      `${user.name}, aapke paas ₹${formatFullCurrency(investable)}/month invest karne ka potential hai. Even ₹500 SIP in Nifty 50 Index = ₹5.8L in 10 years @12%. Start today!`,
      '🚀', 'high', ts, undefined, 'Invest Now', 'Home');
  }

  const lastInv = new Date(investments[0].date);
  const daysSince = Math.round((Date.now() - lastInv.getTime()) / 86400000);
  const thisMonthInv = investments.filter(i => {
    const d = new Date(i.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const thisMonthTotal = thisMonthInv.reduce((s, i) => s + i.amount, 0);
  const remaining = investable - thisMonthTotal;

  if (daysSince > 35) {
    return makeNotif('sip_reminder', `🚨 ${daysSince} Din — SIP Miss!`,
      `Last investment ${daysSince} days ago! ₹${formatFullCurrency(investable)} pending. Missing 1 month SIP = ₹${formatFullCurrency(Math.round(investable * 12 * 0.12))} less in 10 years.`,
      '🚨', 'high', ts, undefined, 'Invest Now', 'Home');
  } else if (remaining > investable * 0.5 && new Date().getDate() > 20) {
    return makeNotif('sip_reminder', `📅 ₹${formatFullCurrency(remaining)} Baaki Hai This Month`,
      `Iss month sirf ₹${formatFullCurrency(thisMonthTotal)} invested. ₹${formatFullCurrency(remaining)} aur invest karo before month end. Consistency builds wealth!`,
      '📅', 'medium', ts, undefined, 'Record', 'Home');
  }

  return null;
}

// ═══════════════════════════════════════════
// Learning tip
// ═══════════════════════════════════════════

function generateLearningTip(user: UserProfile, ts: string): ProactiveNotification {
  const inv = Math.max(0, user.monthlyIncome - user.monthlyExpense);
  const tips = [
    { t: '💡 Rule of 72', b: `₹${formatFullCurrency(inv)}/mo @ 12% doubles in 6 years. @ 15% doubles in 4.8 years. Start in index funds for 12% CAGR.` },
    { t: '💡 SIP vs Lump Sum', b: `SIP wins 70% of the time vs lump sum. ₹${formatFullCurrency(inv)} monthly is better than ₹${formatFullCurrency(inv * 12)} once a year.` },
    { t: '💡 Direct vs Regular Plans', b: 'Direct plans save 0.5-1% annually in commission. On ₹10L, that\'s ₹5K-10K/year MORE in your pocket. Always go Direct!' },
    { t: '💡 ELSS Tax Hack', b: `₹12,500/month in ELSS = ₹1.5L 80C deduction = ₹46,800 tax saved (30% bracket). Plus 15% CAGR equity returns!` },
    { t: '💡 Emergency Fund Rule', b: `You need ₹${formatFullCurrency(user.monthlyExpense * 6)} (6 months expenses) in liquid fund BEFORE equity. It's your financial airbag.` },
    { t: '💡 The 50-30-20 Rule', b: `Income: 50% needs, 30% wants, 20% invest. Your ₹${formatFullCurrency(user.monthlyIncome)}: ₹${formatFullCurrency(Math.round(user.monthlyIncome * 0.2))} should go to investments.` },
    { t: '💡 Why Index Fund?', b: '90% of active fund managers fail to beat Nifty 50 over 10 years. Index fund = guaranteed market return at 0.1% cost.' },
    { t: '💡 Compounding Magic', b: `₹${formatFullCurrency(inv)}/mo from age ${user.age} to 60 @ 12% = ₹${formatFullCurrency(Math.round(inv * ((Math.pow(1.01, (60 - user.age) * 12) - 1) / 0.01)))}. Start NOW.` },
    { t: '💡 Gold Allocation', b: '5-10% portfolio in gold (Sovereign Gold Bond or Gold ETF). Hedge against inflation + equity crashes. SGB gives 2.5% interest too!' },
    { t: '💡 Debt:Equity Ratio', b: `Age ${user.age}: keep ${Math.min(80, 100 - user.age)}% equity, ${Math.max(20, user.age)}% debt. Rebalance yearly. Young = more equity.` },
  ];
  const tip = tips[Math.floor(Math.random() * tips.length)];
  return makeNotif('learning', tip.t, tip.b, '💡', 'low', ts);
}

// ═══════════════════════════════════════════
// Helper
// ═══════════════════════════════════════════

function makeNotif(
  type: ProactiveNotification['type'], title: string, body: string,
  emoji: string, urgency: ProactiveNotification['urgency'], timestamp: string,
  detail?: string, actionLabel?: string, actionRoute?: string,
): ProactiveNotification {
  return { id: generateId(), type, title, body, detail, emoji, urgency, timestamp, read: false, actionLabel, actionRoute };
}

