/**
 * Market Intelligence Service
 *
 * Provides real-time and cached market data for the AI to make
 * contextual investment suggestions. Uses free APIs where possible,
 * with smart fallback to curated data when APIs are unavailable.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const MARKET_CACHE_KEY = '@nivesh_market_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 min cache

export interface MarketData {
  nifty50: { value: number; change: number; changePercent: number };
  sensex: { value: number; change: number; changePercent: number };
  goldPrice: number;         // per 10g in INR
  fdRate: number;            // avg 1yr FD rate
  repoRate: number;          // RBI repo rate
  inflation: number;         // CPI YoY%
  marketSentiment: 'fear' | 'neutral' | 'greed';
  sectorHighlights: SectorSignal[];
  lastUpdated: string;       // ISO date
  isLive: boolean;           // true if from API, false if fallback
}

export interface SectorSignal {
  name: string;
  trend: 'bullish' | 'bearish' | 'neutral';
  note: string;
}

// ═══════════════════════════════════════════
// Fetch market data (with fallback)
// ═══════════════════════════════════════════

export async function getMarketData(): Promise<MarketData> {
  // Check cache first
  try {
    const cached = await AsyncStorage.getItem(MARKET_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      const age = Date.now() - new Date(parsed.lastUpdated).getTime();
      if (age < CACHE_DURATION) return parsed;
    }
  } catch {}

  // Try live API
  const liveData = await fetchLiveMarketData();
  if (liveData) {
    await AsyncStorage.setItem(MARKET_CACHE_KEY, JSON.stringify(liveData));
    return liveData;
  }

  // Fallback to curated data
  return getFallbackMarketData();
}

async function fetchLiveMarketData(): Promise<MarketData | null> {
  try {
    // Use Google Finance / Yahoo Finance lite API for Nifty
    const response = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI?interval=1d&range=1d',
      { headers: { 'User-Agent': 'NiveshSaathi/1.0' } }
    );

    if (!response.ok) return null;
    const data = await response.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const prevClose = meta.chartPreviousClose || meta.previousClose || 0;
    const currentPrice = meta.regularMarketPrice || 0;
    const change = currentPrice - prevClose;
    const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

    // Determine market sentiment from change
    let sentiment: 'fear' | 'neutral' | 'greed' = 'neutral';
    if (changePercent < -1.5) sentiment = 'fear';
    else if (changePercent > 1.5) sentiment = 'greed';

    const marketData: MarketData = {
      nifty50: { value: Math.round(currentPrice), change: Math.round(change), changePercent: Math.round(changePercent * 100) / 100 },
      sensex: { value: Math.round(currentPrice * 3.3), change: Math.round(change * 3.3), changePercent: Math.round(changePercent * 100) / 100 },
      goldPrice: 95000,      // Update dynamically if gold API available
      fdRate: 7.1,
      repoRate: 6.5,
      inflation: 4.5,
      marketSentiment: sentiment,
      sectorHighlights: generateSectorSignals(changePercent),
      lastUpdated: new Date().toISOString(),
      isLive: true,
    };

    return marketData;
  } catch (e) {
    console.log('Market API failed:', e);
    return null;
  }
}

function generateSectorSignals(niftyChange: number): SectorSignal[] {
  // Contextual sector signals based on market movement
  const signals: SectorSignal[] = [];

  if (niftyChange < -2) {
    signals.push({ name: 'IT', trend: 'bearish', note: 'Market correction — IT stocks down' });
    signals.push({ name: 'Banking', trend: 'bearish', note: 'Rate-sensitive sectors under pressure' });
    signals.push({ name: 'FMCG', trend: 'neutral', note: 'Defensive sector holding steady' });
  } else if (niftyChange > 2) {
    signals.push({ name: 'Banking', trend: 'bullish', note: 'Banking rally — credit growth strong' });
    signals.push({ name: 'Auto', trend: 'bullish', note: 'Consumer demand improving' });
    signals.push({ name: 'IT', trend: 'neutral', note: 'Stable but global headwinds remain' });
  } else {
    signals.push({ name: 'Index Funds', trend: 'bullish', note: 'Steady market — ideal for SIP' });
    signals.push({ name: 'ELSS', trend: 'bullish', note: 'Tax-saving + equity growth' });
    signals.push({ name: 'Gold', trend: 'neutral', note: 'Hedge allocation at 5-10%' });
  }

  return signals;
}

function getFallbackMarketData(): MarketData {
  // Curated data based on recent market state
  const month = new Date().getMonth();
  const isTaxSeason = month >= 0 && month <= 2;

  return {
    nifty50: { value: 24500, change: 0, changePercent: 0 },
    sensex: { value: 80500, change: 0, changePercent: 0 },
    goldPrice: 95000,
    fdRate: 7.1,
    repoRate: 6.5,
    inflation: 4.5,
    marketSentiment: 'neutral',
    sectorHighlights: [
      { name: 'Index Funds', trend: 'bullish', note: 'Long-term SIP remains best strategy' },
      { name: 'Liquid Funds', trend: 'bullish', note: 'Good for emergency fund at ~7%' },
      ...(isTaxSeason ? [{ name: 'ELSS', trend: 'bullish' as const, note: 'Last chance for 80C tax saving!' }] : []),
    ],
    lastUpdated: new Date().toISOString(),
    isLive: false,
  };
}

// ═══════════════════════════════════════════
// Market context for AI prompt
// ═══════════════════════════════════════════

export function buildMarketContext(market: MarketData): string {
  const lines: string[] = [];
  lines.push('LIVE MARKET DATA:');
  lines.push(`- Nifty 50: ${market.nifty50.value} (${market.nifty50.changePercent >= 0 ? '+' : ''}${market.nifty50.changePercent}%)`);
  lines.push(`- Market Sentiment: ${market.marketSentiment.toUpperCase()}`);
  lines.push(`- Gold: ₹${market.goldPrice.toLocaleString('en-IN')}/10g`);
  lines.push(`- FD Rate: ${market.fdRate}% | Repo: ${market.repoRate}% | Inflation: ${market.inflation}%`);
  lines.push(`- Real FD return (post-inflation): ${(market.fdRate - market.inflation).toFixed(1)}%`);

  if (market.sectorHighlights.length > 0) {
    lines.push('\nSECTOR SIGNALS:');
    for (const s of market.sectorHighlights) {
      const icon = s.trend === 'bullish' ? '📈' : s.trend === 'bearish' ? '📉' : '➡️';
      lines.push(`${icon} ${s.name}: ${s.note}`);
    }
  }

  lines.push(`\nData: ${market.isLive ? 'Live' : 'Cached'} | Updated: ${new Date(market.lastUpdated).toLocaleTimeString()}`);
  return lines.join('\n');
}

// ═══════════════════════════════════════════
// Investment verdict — called when user records
// ═══════════════════════════════════════════

export interface InvestmentVerdict {
  rating: 'excellent' | 'good' | 'caution' | 'warning';
  title: string;
  message: string;
  tips: string[];
}

export function getInvestmentVerdict(
  amount: number,
  bucket: 'safe' | 'growth' | 'opportunity',
  market: MarketData,
  userRisk: string,
  totalInBucket: number,
  totalInvested: number,
  emergencyFundPercent: number,
): InvestmentVerdict {
  const tips: string[] = [];
  let rating: InvestmentVerdict['rating'] = 'good';
  let title = '';
  let message = '';

  const bucketPercent = totalInvested > 0 ? Math.round(((totalInBucket + amount) / (totalInvested + amount)) * 100) : 100;

  // Bucket-specific analysis
  if (bucket === 'opportunity') {
    if (userRisk === 'safe') {
      rating = 'warning';
      title = 'High Risk Alert';
      message = `Aapki risk profile Safe hai lekin Opportunity Pocket mein invest kar rahe ho. Yeh zyada risky hai.`;
      tips.push('Safe profile ke liye Opportunity max 5-10% rakhein');
    } else if (market.marketSentiment === 'greed' && market.nifty50.changePercent > 2) {
      rating = 'caution';
      title = 'Market Overheated';
      message = `Market abhi ${market.nifty50.changePercent}% upar hai — euphoria mein invest karna risky ho sakta hai.`;
      tips.push('SIP continue karo lekin lump sum avoid karo');
      tips.push('Market dip ka wait karo for large investments');
    } else if (market.marketSentiment === 'fear') {
      rating = 'excellent';
      title = 'Smart Timing! 🎯';
      message = `Market fear zone mein hai — historically yeh invest karne ka best time hai.`;
      tips.push('"Be greedy when others are fearful" — Warren Buffett');
    } else {
      rating = 'good';
      title = 'Good Move';
      message = `Opportunity bucket mein invest karna growth ke liye achha hai.`;
    }
  } else if (bucket === 'safe') {
    if (emergencyFundPercent < 100) {
      rating = 'excellent';
      title = 'Smart Priority! ✅';
      message = `Emergency fund pehle banana — bahut achha decision. Currently ${emergencyFundPercent}% complete.`;
      tips.push('6 months expenses = target emergency fund');
    } else {
      rating = 'good';
      title = 'Safe & Steady';
      message = `Safe pocket mein invest — low risk, stable returns.`;
      if (bucketPercent > 60 && userRisk !== 'safe') {
        tips.push(`Safe mein ${bucketPercent}% ho gaya — growth mein bhi daalo`);
        rating = 'caution';
      }
    }
  } else {
    // Growth bucket
    if (market.marketSentiment === 'fear') {
      rating = 'excellent';
      title = 'Perfect SIP Timing! 🎯';
      message = `Market down hai = SIP mein more units milenge. Compound effect long-term mein amazing hoga.`;
    } else {
      rating = 'good';
      title = 'Steady Growth';
      message = `Growth pocket mein SIP best strategy hai — time in market > timing the market.`;
    }
    if (emergencyFundPercent < 50) {
      tips.push('⚠️ Emergency fund incomplete — pehle woh banao');
    }
  }

  // Concentration warning
  if (bucketPercent > 70) {
    tips.push(`⚠️ ${bucketPercent}% ek bucket mein — diversify karo`);
    if (rating === 'good' || rating === 'excellent') rating = 'caution';
  }

  // Amount-based tips
  if (amount > 50000) {
    tips.push('Lump sum ke bajay SIP split karo for rupee cost averaging');
  }

  if (tips.length === 0) {
    tips.push('Consistency > Amount — har mahine invest karte raho! 🎯');
  }

  return { rating, title, message, tips };
}

