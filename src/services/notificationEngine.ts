/**
 * Proactive Notification Service
 *
 * Generates AI-powered, context-aware notifications throughout the day.
 * Sector picks, market alerts, SIP reminders, spending warnings.
 *
 * Uses OpenAI when available for hyper-personalized signals,
 * falls back to smart rule-based notifications.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, Investment, Goal, MoneyBucket, Asset, AISignal } from '../types';
import { getApiKey } from './apiKeyStore';
import { MarketData } from './marketIntelligence';
import { generateId, formatFullCurrency } from '../utils/helpers';

const NOTIF_KEY = '@nivesh_notifications';
const NOTIF_GENERATED_KEY = '@nivesh_notif_generated_date';

export interface ProactiveNotification {
  id: string;
  type: 'sector_pick' | 'market_alert' | 'sip_reminder' | 'spend_warning' | 'opportunity' | 'learning' | 'goal_update' | 'ai_insight';
  title: string;
  body: string;
  detail?: string;        // expanded content
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
  await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(notifs.slice(0, 50))); // keep last 50
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
// AI-Powered Notification Generator
// ═══════════════════════════════════════════

export async function generateAINotifications(
  user: UserProfile,
  market: MarketData,
  investments: Investment[],
  goals: Goal[],
  buckets: MoneyBucket[],
  assets: Asset[],
  signals: AISignal[],
): Promise<ProactiveNotification[]> {
  // Check if already generated today
  const lastDate = await AsyncStorage.getItem(NOTIF_GENERATED_KEY);
  const today = new Date().toISOString().slice(0, 10);
  if (lastDate === today) {
    return loadNotifications();
  }

  const newNotifs: ProactiveNotification[] = [];
  const ts = new Date().toISOString();
  const investable = Math.max(0, user.monthlyIncome - user.monthlyExpense);

  // ── Try AI-powered sector picks ──
  const aiSectorPicks = await generateAISectorPicks(user, market, assets);
  if (aiSectorPicks) {
    newNotifs.push(...aiSectorPicks);
  } else {
    // Fallback: rule-based sector picks
    newNotifs.push(...generateRuleBasedSectorPicks(user, market));
  }

  // ── Market sentiment notification ──
  newNotifs.push(generateMarketSentimentNotif(market, ts));

  // ── SIP reminder ──
  const sipNotif = generateSIPReminder(user, investments, investable, ts);
  if (sipNotif) newNotifs.push(sipNotif);

  // ── Goal progress alerts ──
  for (const g of goals) {
    const pct = g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0;
    if (pct >= 90 && pct < 100) {
      newNotifs.push(makeNotif('goal_update', `${g.emoji} ${g.name} — Almost There!`,
        `${pct}% complete! Bas thoda aur — ₹${formatFullCurrency(g.targetAmount - g.currentAmount)} baaki hai.`,
        '🎉', 'medium', ts));
    } else if (pct >= 100) {
      newNotifs.push(makeNotif('goal_update', `${g.emoji} ${g.name} — Goal Achieved! 🏆`,
        `Congratulations! Aapne ₹${formatFullCurrency(g.targetAmount)} ka goal achieve kar liya!`,
        '🏆', 'high', ts));
    }
  }

  // ── Opportunity signals from companion ──
  const topSignals = signals.filter(s => s.urgency === 'high' && !s.read).slice(0, 2);
  for (const sig of topSignals) {
    newNotifs.push(makeNotif('opportunity', sig.title, sig.description,
      sig.type === 'buy' ? '📈' : sig.type === 'alert' ? '⚠️' : '💡',
      'high', ts));
  }

  // ── Daily learning tip ──
  newNotifs.push(generateLearningTip(user, ts));

  // ── AI market insight (if API available) ──
  const aiInsight = await generateAIMarketInsight(user, market);
  if (aiInsight) newNotifs.push(aiInsight);

  // Save and mark as generated today
  const existing = await loadNotifications();
  const merged = [...newNotifs, ...existing].slice(0, 50);
  await saveNotifications(merged);
  await AsyncStorage.setItem(NOTIF_GENERATED_KEY, today);

  return merged;
}

// ═══════════════════════════════════════════
// AI Sector Picks (uses OpenAI)
// ═══════════════════════════════════════════

async function generateAISectorPicks(
  user: UserProfile,
  market: MarketData,
  assets: Asset[],
): Promise<ProactiveNotification[] | null> {
  try {
    const apiKey = await getApiKey();
    if (!apiKey) return null;

    const assetList = assets.map(a => `${a.name} (${a.type})`).join(', ') || 'No assets yet';
    const prompt = `You are an Indian stock market analyst. Today's data:
- Nifty: ${market.nifty50.value} (${market.nifty50.changePercent}%)
- Sentiment: ${market.marketSentiment}
- FD Rate: ${market.fdRate}%, Inflation: ${market.inflation}%
- User risk profile: ${user.riskLevel}, Age: ${user.age}
- User's current assets: ${assetList}

Generate exactly 3 sector/investment picks for TODAY. For each:
1. Sector or specific fund type (e.g., "IT Sector", "Nifty 50 Index Fund", "Gold ETF")
2. Action: BUY / ACCUMULATE / WATCH
3. One-line reasoning (max 20 words)
4. Risk level: Low / Medium / High

Format as JSON array: [{"sector":"...","action":"...","reason":"...","risk":"..."}]
Only JSON, no other text.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) return null;

    // Parse JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return null;
    const picks = JSON.parse(jsonMatch[0]);

    const ts = new Date().toISOString();
    return picks.map((p: any, i: number) => makeNotif(
      'sector_pick',
      `${p.action === 'BUY' ? '🟢' : p.action === 'WATCH' ? '👁️' : '🟡'} ${p.sector}`,
      `${p.action}: ${p.reason}`,
      p.action === 'BUY' ? '📈' : '👁️',
      p.risk === 'High' ? 'high' : p.risk === 'Low' ? 'low' : 'medium',
      ts,
      `Risk: ${p.risk} | Based on current market conditions and your ${user.riskLevel} profile`,
    ));
  } catch (e) {
    console.log('AI sector picks failed:', e);
    return null;
  }
}

// ═══════════════════════════════════════════
// AI Market Insight (daily personalized)
// ═══════════════════════════════════════════

async function generateAIMarketInsight(
  user: UserProfile,
  market: MarketData,
): Promise<ProactiveNotification | null> {
  try {
    const apiKey = await getApiKey();
    if (!apiKey) return null;

    const prompt = `You are Nivesh Saathi AI. Give a 2-line personalized market insight for today in Hinglish.
User: ${user.name}, Age ${user.age}, Risk: ${user.riskLevel}, Investable: ₹${(user.monthlyIncome - user.monthlyExpense).toLocaleString('en-IN')}/mo.
Market: Nifty ${market.nifty50.value} (${market.nifty50.changePercent >= 0 ? '+' : ''}${market.nifty50.changePercent}%), Sentiment: ${market.marketSentiment}, Gold: ₹${market.goldPrice}, Inflation: ${market.inflation}%.
Be specific, actionable. Max 50 words. Include one emoji.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
        temperature: 0.8,
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) return null;

    return makeNotif('ai_insight', '🤖 Saathi ka Market Take', text, '🤖', 'medium', new Date().toISOString());
  } catch { return null; }
}

// ═══════════════════════════════════════════
// Rule-based fallbacks
// ═══════════════════════════════════════════

function generateRuleBasedSectorPicks(user: UserProfile, market: MarketData): ProactiveNotification[] {
  const ts = new Date().toISOString();
  const picks: ProactiveNotification[] = [];

  if (market.marketSentiment === 'fear') {
    picks.push(makeNotif('sector_pick', '🟢 Large Cap / Index Funds', 'Market dip = best SIP entry. Nifty 50 index fund mein invest karo — historically recovers in 1-2 years.', '📈', 'high', ts, 'Fear zone buying has historically given 15-20% extra returns'));
    picks.push(makeNotif('sector_pick', '🟢 Banking Sector', 'Bank Nifty correction mein hai — strong fundamentals, credit growth 15%+. SBI, HDFC Bank are solid picks.', '🏦', 'medium', ts));
    picks.push(makeNotif('sector_pick', '🟡 Gold ETF', `Gold ₹${(market.goldPrice / 1000).toFixed(0)}K/10g — safe haven in fear market. 5-10% portfolio mein rakhein.`, '🥇', 'low', ts));
  } else if (market.marketSentiment === 'greed') {
    picks.push(makeNotif('sector_pick', '⚠️ Caution: Avoid Lump Sum', 'Market greed zone mein hai. Only SIP karo, lump sum avoid karo. Profit booking consider karo.', '⚠️', 'high', ts));
    picks.push(makeNotif('sector_pick', '🟢 Debt Funds / Liquid Funds', `FD rate ${market.fdRate}% — liquid funds similar returns with better tax. Cash build karo for next dip.`, '🏦', 'low', ts));
    picks.push(makeNotif('sector_pick', '👁️ IT Sector — Watch', 'IT valuations stretched. Watch for correction before entry. TCS, Infosys on watchlist rakhein.', '👁️', 'medium', ts));
  } else {
    picks.push(makeNotif('sector_pick', '🟢 Nifty 50 Index Fund', 'Steady market = perfect SIP environment. ₹500/month se start karo, 12% CAGR expected long-term.', '📊', 'low', ts));
    picks.push(makeNotif('sector_pick', '🟢 Flexi Cap Funds', `Balanced risk ke liye flexi cap best. Fund manager picks allocation. ${user.riskLevel === 'aggressive' ? 'Parag Parikh, PPFAS' : 'HDFC Flexi Cap'} consider karo.`, '📈', 'medium', ts));
    if (user.riskLevel !== 'safe') {
      picks.push(makeNotif('sector_pick', '🟡 Mid Cap — Selective', 'Mid caps growth story strong. But selective raho — only established names via mid cap funds.', '🔍', 'medium', ts));
    } else {
      picks.push(makeNotif('sector_pick', '🟢 PPF / Debt Funds', `Safe profile ke liye PPF (7.1% tax-free) + short-term debt funds. Guaranteed + stable.`, '🔒', 'low', ts));
    }
  }

  return picks;
}

function generateMarketSentimentNotif(market: MarketData, ts: string): ProactiveNotification {
  const emoji = market.nifty50.changePercent >= 1 ? '📈' : market.nifty50.changePercent <= -1 ? '📉' : '➡️';
  const mood = market.marketSentiment === 'fear' ? 'Fear zone — buying opportunity!' : market.marketSentiment === 'greed' ? 'Greed zone — be cautious!' : 'Neutral — steady SIP karo.';

  return makeNotif('market_alert',
    `${emoji} Market Update: Nifty ${market.nifty50.value.toLocaleString()}`,
    `${market.nifty50.changePercent >= 0 ? '+' : ''}${market.nifty50.changePercent}% today. ${mood} Gold: ₹${(market.goldPrice / 1000).toFixed(0)}K. Real FD return: ${(market.fdRate - market.inflation).toFixed(1)}%.`,
    emoji, market.marketSentiment === 'fear' ? 'high' : 'low', ts);
}

function generateSIPReminder(user: UserProfile, investments: Investment[], investable: number, ts: string): ProactiveNotification | null {
  if (investments.length === 0) {
    return makeNotif('sip_reminder', '🚀 Start Your First SIP Today!',
      `${user.name}, ₹${formatFullCurrency(investable)} invest kar sakte ho har mahine. ₹500 se bhi shuru kar sakte ho — late mat karo!`,
      '🚀', 'high', ts, undefined, 'Record', 'Home');
  }

  const lastInv = new Date(investments[0].date);
  const daysSince = Math.round((Date.now() - lastInv.getTime()) / (24 * 60 * 60 * 1000));

  if (daysSince > 28) {
    return makeNotif('sip_reminder', `⏰ SIP Due — ${daysSince} Din Ho Gaye!`,
      `Last investment ${daysSince} din pehle tha. ₹${formatFullCurrency(investable)} invest karna mat bhoolna! Consistency > Amount.`,
      '⏰', 'high', ts, undefined, 'Invest Now', 'Home');
  } else if (daysSince > 20) {
    return makeNotif('sip_reminder', '📅 SIP Time Coming Up',
      `Month end aa raha hai. ₹${formatFullCurrency(investable)} ready rakhein investment ke liye. Auto-debit set karo for discipline.`,
      '📅', 'medium', ts);
  }

  return null;
}

function generateLearningTip(user: UserProfile, ts: string): ProactiveNotification {
  const tips = [
    { title: '💡 Did you know?', body: 'Rule of 72: Divide 72 by return rate = years to double money. 12% return = 6 years to double! Start SIP today.' },
    { title: '💡 Tax Tip', body: 'ELSS funds mein invest karke Section 80C ke under ₹1.5L tax bachao. 3 year lock-in but best tax-saving option.' },
    { title: '💡 Emergency Fund', body: '6 months ka expense liquid fund mein rakhein. Ye aapka financial airbag hai — invest karne se pehle ye banao.' },
    { title: '💡 SIP Magic', body: '₹5,000/month SIP @ 12% = ₹50 lakh in 20 years! Compound interest is the 8th wonder. Start early, stay consistent.' },
    { title: '💡 Diversification', body: 'Sab paise ek jagah mat lagao. 60% equity + 30% debt + 10% gold = balanced portfolio for long-term.' },
    { title: '💡 Index Fund Power', body: 'Warren Buffett recommends index funds. Nifty 50 has given ~12% CAGR over 20 years. Low cost, high returns.' },
    { title: '💡 Avoid FOMO', body: 'Jo stock trending hai woh best nahi hota. Fundamentals dekho, hype se bcho. SIP + patience = wealth.' },
    { title: '💡 Inflation Enemy', body: `FD rate ${user.age < 30 ? '7%' : '7.5%'}, Inflation ~5%. Real return sirf 2%. Equity zaruri hai inflation beat karne ke liye.` },
    { title: '💡 Pay Yourself First', body: 'Salary aate hi pehle invest karo, phir kharcho. ₹Income - ₹Invest = ₹Spend, not the other way around.' },
    { title: '💡 Power of Starting Early', body: `Age ${user.age} pe start = amazing compounding. 10 saal late start = almost half wealth. Time is money, literally.` },
  ];
  const tip = tips[new Date().getDate() % tips.length];
  return makeNotif('learning', tip.title, tip.body, '💡', 'low', ts);
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

