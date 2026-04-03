import { UserProfile, RiskLevel, Investment, MoneyBucket, Goal } from '../types';
import { getApiKey } from './apiKeyStore';
import { analyzePortfolio } from './portfolioAnalyzer';

interface AIResponse {
  text: string;
  suggestions?: string[];
}

const SYSTEM_PROMPT = (user: UserProfile | null, portfolioSummary?: string) => {
  const name = user?.name || 'User';
  const income = user?.monthlyIncome || 0;
  const expense = user?.monthlyExpense || 0;
  const investable = Math.max(0, income - expense);
  const risk = user?.riskLevel || 'balanced';
  const age = user?.age || 25;
  const goal = user?.primaryGoal || 'wealth';

  const portfolioBlock = portfolioSummary
    ? `\n\n${portfolioSummary}`
    : '\n\nNOTE: No investments recorded yet. Encourage user to start investing and record their first investment.';

  return `You are "Nivesh Saathi" — an AI financial advisor for Indians. You speak in Hinglish (mix of Hindi and English) in a friendly, approachable tone.

USER PROFILE:
- Name: ${name}
- Age: ${age}
- Monthly Income: ₹${income.toLocaleString('en-IN')}
- Monthly Expense: ₹${expense.toLocaleString('en-IN')}
- Monthly Investable: ₹${investable.toLocaleString('en-IN')}
- Stated Risk Level: ${risk}
- Primary Goal: ${goal}
${portfolioBlock}

RULES:
1. Always speak in Hinglish (Hindi + English mix). Use simple language.
2. YOUR ADVICE MUST BE BASED ON THE REAL PORTFOLIO DATA ABOVE. Reference their actual allocation, consistency, risk behavior, and goal progress.
3. If you detect risk mismatches or concentration risk in the data, proactively warn the user.
4. Be specific — give exact amounts, fund names, time periods. Use their real numbers.
5. Use emojis sparingly for warmth (1-3 per message).
6. Keep responses concise — max 200 words. Use bullet points.
7. For investment advice, recommend based on their ACTUAL risk behavior (not just stated preference):
   - Safe: Liquid funds, FDs, PPF
   - Balanced: Index funds (Nifty 50), Flexi Cap, ELSS
   - Aggressive: Small cap, Mid cap, sectoral funds
8. Always add a practical, actionable next step.
9. Never promise guaranteed returns. Use words like "expected", "historically".
10. If the user asks about their portfolio, give data-driven analysis, not generic advice.
11. If they have active alerts/warnings in the data, mention them.
12. If asked something non-financial, politely redirect to financial topics.`;
};

// ═══════════════════════════════════════════
// OpenAI API Call
// ═══════════════════════════════════════════
async function callOpenAI(
  query: string,
  user: UserProfile | null,
  conversationHistory: { role: string; content: string }[],
  portfolioSummary?: string,
): Promise<AIResponse | null> {
  try {
    const apiKey = await getApiKey();
    if (!apiKey) return null;

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT(user, portfolioSummary) },
      ...conversationHistory.slice(-6), // Last 6 messages for context
      { role: 'user', content: query },
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.log('OpenAI API error:', response.status);
      return null;
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) return null;

    // Generate contextual suggestions
    const suggestions = generateSmartSuggestions(query, user);

    return { text, suggestions };
  } catch (error) {
    console.log('OpenAI call failed:', error);
    return null;
  }
}

function generateSmartSuggestions(query: string, user: UserProfile | null): string[] {
  const q = query.toLowerCase();
  if (q.includes('sip') || q.includes('mutual')) {
    return ['Best index fund?', 'SIP kitna start karun?', 'Direct ya Regular?'];
  }
  if (q.includes('tax') || q.includes('80c')) {
    return ['ELSS best konsa?', 'NPS worth it?', 'HRA claim kaise?'];
  }
  if (q.includes('emergency') || q.includes('safe')) {
    return ['Liquid fund vs FD?', 'Kitna rakhna chahiye?', 'Kahan invest karun?'];
  }
  if (q.includes('goal') || q.includes('plan')) {
    return ['Ghar ka plan banao', 'Retirement planning', 'Bachche ki padhai'];
  }
  return [
    'SIP kaise start karun?',
    'Tax kaise bachaye?',
    'Emergency fund kitna ho?',
    'Mera plan review karo',
  ];
}

// ═══════════════════════════════════════════
// Smart Offline Fallback (much improved)
// ═══════════════════════════════════════════
function getOfflineResponse(query: string, user: UserProfile | null): AIResponse {
  const q = query.toLowerCase();
  const name = user?.name || 'Dost';
  const income = user?.monthlyIncome || 30000;
  const expense = user?.monthlyExpense || 20000;
  const investable = Math.max(0, income - expense);
  const riskLevel = user?.riskLevel || 'balanced';

  // Keyword scoring system — score each topic and pick the best match
  const topics: { score: number; response: () => AIResponse }[] = [
    {
      score: scoreKeywords(q, ['sip', 'systematic', 'monthly invest', 'recurring']),
      response: () => {
        const sipAmt = Math.round(investable * 0.4);
        return {
          text: `${name}, SIP (Systematic Investment Plan) sabse simple investing method hai!\n\nHar mahine fixed amount auto-invest hota hai:\n\n• Aapke liye SIP: ₹${sipAmt.toLocaleString('en-IN')}/mo\n• Kahan: Nifty 50 Index Fund\n• Expected: ~12-15% p.a. over 10 years\n\n10 saal mein ~₹${Math.round(sipAmt * 12 * 10 * 1.8).toLocaleString('en-IN')} ban sakta hai!\n\n💡 Start with any amount — ₹500 bhi chalega.`,
          suggestions: ['Konsa fund best hai?', 'SIP kaise start karein?', 'Direct vs Regular?'],
        };
      },
    },
    {
      score: scoreKeywords(q, ['emergency', 'rainy', 'backup', 'urgent', 'liquid']),
      response: () => {
        const target = expense * 6;
        return {
          text: `${name}, emergency fund = 6 months ka kharcha\n\nAapke liye target: ₹${target.toLocaleString('en-IN')}\n\n• Monthly save: ₹${Math.round(target / 12).toLocaleString('en-IN')}\n• Kahan: Liquid Fund (instant withdrawal)\n• Returns: ~6-7% p.a.\n\n⚡ Pehle yeh banao, phir investments shuru karo.`,
          suggestions: ['Liquid fund kya hai?', 'FD ya Liquid fund?', 'Kab complete hoga?'],
        };
      },
    },
    {
      score: scoreKeywords(q, ['tax', '80c', '80d', 'save tax', 'deduction', 'itr']),
      response: () => ({
        text: `${name}, tax bachana = smart investing!\n\n📋 Section 80C (₹1.5L limit):\n1. ELSS Fund — Best! 3yr lock-in, ~12-15% returns\n2. PPF — Safe, 7.1% guaranteed, 15yr\n3. NPS — Extra ₹50K deduction\n\n📋 Section 80D:\n• Health insurance premium — ₹25K-₹1L\n\n💡 Tip: ₹${Math.min(12500, Math.round(investable * 0.3)).toLocaleString('en-IN')}/mo ELSS SIP se tax + wealth dono save!`,
        suggestions: ['ELSS fund konsa?', 'PPF vs ELSS?', 'NPS details batao'],
      }),
    },
    {
      score: scoreKeywords(q, ['mutual fund', 'fund', 'konsa fund', 'best fund', 'index fund', 'nifty']),
      response: () => {
        const picks: Record<string, string> = {
          safe: '• Liquid Fund — emergency ke liye\n• Short Duration Debt Fund\n• Banking & PSU Fund',
          balanced: '• Nifty 50 Index Fund — core holding\n• Flexi Cap Fund — diversified\n• ELSS — tax saving + growth',
          aggressive: '• Nifty Next 50 Index Fund\n• Mid Cap Fund\n• Small Cap Fund (risky!)',
        };
        return {
          text: `${name}, aapki ${riskLevel} risk profile ke liye:\n\n${picks[riskLevel]}\n\nSimple start: ₹${Math.round(investable * 0.5).toLocaleString('en-IN')}/mo Nifty 50 Index Fund\n\n💡 1-2 funds kaafi hain shuru mein. Zyada mat lo!`,
          suggestions: ['Index fund kya hai?', 'Direct ya Regular?', 'Returns kitna milega?'],
        };
      },
    },
    {
      score: scoreKeywords(q, ['ghar', 'house', 'home', 'flat', 'property', 'real estate']),
      response: () => ({
        text: `${name}, ghar ka sapna — smart planning chahiye! 🏠\n\n• Down payment (20%): ₹10-15L save karo\n• Time: 7-10 years mein plan karo\n• Monthly SIP: ₹${Math.round(1500000 / (8 * 12)).toLocaleString('en-IN')} for ₹15L in 8yrs\n• Fund: Flexi Cap + Mid Cap mix\n\n⚠️ Home loan EMI < 30% of income rakhna.`,
        suggestions: ['Down payment plan', 'Home loan tips', 'Rent vs Buy?'],
      }),
    },
    {
      score: scoreKeywords(q, ['padhai', 'education', 'bachch', 'child', 'school', 'college', 'kids']),
      response: () => ({
        text: `${name}, bachche ka future = early planning!\n\nEducation cost estimate (2035):\n• Engineering: ₹20-30L\n• MBA: ₹25-40L\n• Abroad: ₹50L-1Cr+\n\n₹5000/mo SIP × 15 years = ~₹25L (at 12%)\n\n💡 Education inflation 10-12% hai — equity jaruri!`,
        suggestions: ['Sukanya Samriddhi?', 'Kitna amount chahiye?', 'Education fund?'],
      }),
    },
    {
      score: scoreKeywords(q, ['market', 'loss', 'neeche', 'crash', 'gir', 'down', 'bear', 'correction']),
      response: () => ({
        text: `${name}, market gira? DON'T PANIC!\n\nHistory:\n• 2008: -60% → 3yr mein recovered\n• 2020: -38% → 1yr mein new high\n\n✅ SIP continue karo — crash = discount shopping!\n✅ Extra paisa hai? Invest karo\n❌ Panic sell mat karo\n❌ Daily mat dekho portfolio\n\nLong term mein equity always wins.`,
        suggestions: ['Portfolio safe hai?', 'More invest karun?', 'Kab recover hoga?'],
      }),
    },
    {
      score: scoreKeywords(q, ['kitna invest', 'how much', 'kitna daalun', 'start', 'shuru', 'begin']),
      response: () => ({
        text: `${name}, simple plan:\n\n💰 Income: ₹${income.toLocaleString('en-IN')}\n💸 Expense: ₹${expense.toLocaleString('en-IN')}\n✅ Investable: ₹${investable.toLocaleString('en-IN')}/mo\n\n50-30-20 Rule follow karo:\n• 50% Needs\n• 30% Wants\n• 20% Investments (min ₹${Math.round(income * 0.2).toLocaleString('en-IN')})\n\nPehle invest, phir kharcha!`,
        suggestions: ['Bucket plan banao', 'SIP start karna hai', 'Emergency fund pehle?'],
      }),
    },
    {
      score: scoreKeywords(q, ['grow', 'return', 'kitna milega', 'profit', 'compound', 'future']),
      response: () => {
        const sip = Math.round(investable * 0.5);
        return {
          text: `${name}, compound interest ka magic:\n\n₹${sip.toLocaleString('en-IN')}/mo invest karo:\n• 5 yr: ~₹${Math.round(sip * 12 * 5 * 1.4).toLocaleString('en-IN')}\n• 10 yr: ~₹${Math.round(sip * 12 * 10 * 2.0).toLocaleString('en-IN')}\n• 20 yr: ~₹${Math.round(sip * 12 * 20 * 4.5).toLocaleString('en-IN')}\n\nTIME > Amount. Jaldi start karo!`,
          suggestions: ['SIP calculator use karo', 'More invest karun?', 'Best fund for growth?'],
        };
      },
    },
    {
      score: scoreKeywords(q, ['gold', 'sona', 'digital gold', 'sovereign']),
      response: () => ({
        text: `${name}, gold investment ke options:\n\n1. Sovereign Gold Bond (SGB) — BEST!\n   • Govt guaranteed\n   • 2.5% interest + gold price gain\n   • Tax free if held 8 years\n\n2. Gold ETF — easy to buy/sell\n3. Digital Gold — small amounts\n\n❌ Physical gold avoid karo — making charges + storage risk\n\n💡 Portfolio ka 5-10% gold mein rakho.`,
        suggestions: ['SGB kaise khareedein?', 'Gold ETF vs SGB?', 'Kitna gold rakhna chahiye?'],
      }),
    },
    {
      score: scoreKeywords(q, ['fd', 'fixed deposit', 'bank', 'savings', 'rbi', 'interest rate']),
      response: () => ({
        text: `${name}, FD safe hai par returns kam:\n\n• FD rate: ~7% (pre-tax ~5% post-tax)\n• Inflation: ~6%\n• Real return: ~1% 😕\n\nBetter alternatives:\n1. Liquid Fund — FD jaisa safe, better returns\n2. Debt Fund — 7-9% tax-efficient\n3. RBI Floating Rate Bond — 8.05%\n\n💡 Emergency fund ke liye hi FD/Liquid use karo. Growth ke liye equity jaruri!`,
        suggestions: ['Liquid fund batao', 'Debt fund kya hai?', 'FD vs Mutual Fund?'],
      }),
    },
    {
      score: scoreKeywords(q, ['insurance', 'term', 'lic', 'health', 'life']),
      response: () => ({
        text: `${name}, insurance = protection, NOT investment!\n\n✅ Jaruri hai:\n1. Term Insurance — 10-15x annual income cover\n   • ₹1Cr cover @ ~₹10-15K/year\n2. Health Insurance — ₹10-20L cover\n   • Family floater plan best\n\n❌ AVOID:\n• LIC endowment plans\n• ULIPs\n• Money-back policies\n\nInsurance sirf protection ke liye. Investing alag se karo!`,
        suggestions: ['Term plan konsa?', 'Health insurance kitna?', 'LIC band karun?'],
      }),
    },
    {
      score: scoreKeywords(q, ['retire', 'pension', 'old age', 'nps', 'epf', 'retirement']),
      response: () => ({
        text: `${name}, retirement planning jaldi shuru karo!\n\nRule: 25x annual expenses chahiye\n• If expenses ₹${expense.toLocaleString('en-IN')}/mo → Need ₹${(expense * 12 * 25 / 10000000).toFixed(1)}Cr\n\nPlan:\n1. EPF — already ho raha hai (if salaried)\n2. NPS — extra ₹50K tax benefit\n3. Equity SIP — main growth engine\n\n₹${Math.round(investable * 0.3).toLocaleString('en-IN')}/mo × 25 years = substantial corpus!\n\n💡 Start NOW — every year delay = lakhs ka loss.`,
        suggestions: ['NPS details batao', 'FIRE kya hai?', 'Kitna chahiye retire ke liye?'],
      }),
    },
    {
      score: scoreKeywords(q, ['stock', 'share', 'trading', 'equity', 'demat', 'zerodha', 'groww']),
      response: () => ({
        text: `${name}, direct stocks = higher risk + reward\n\nBeginner ke liye:\n1. Index Fund se shuru karo (safer)\n2. Direct stocks sirf 10-15% portfolio\n3. Blue chips: Reliance, TCS, HDFC, Infosys\n\n⚠️ Rules:\n• Trading ≠ Investing\n• 5+ year hold karo\n• Portfolio ka max 15% direct stocks mein\n\nPehle index fund, phir stocks. Crawl → Walk → Run.`,
        suggestions: ['Index fund vs stocks?', 'Demat account kaise?', 'Stock kaise select karein?'],
      }),
    },
    {
      score: scoreKeywords(q, ['crypto', 'bitcoin', 'ethereum', 'web3']),
      response: () => ({
        text: `${name}, crypto bahut volatile hai!\n\n⚠️ Meri advice:\n• Portfolio ka max 2-5% crypto mein\n• Sirf woh paisa daalo jo 100% lose kar sakte ho\n• Bitcoin/Ethereum — safest in crypto\n• 30% tax + 1% TDS on gains in India\n\nPehle traditional investments strong karo, phir crypto experiment karo.\n\n💡 Crypto gambling nahi hai — lekin investing bhi nahi hai abhi.`,
        suggestions: ['Tax on crypto?', 'Bitcoin worth it?', 'Crypto vs mutual fund?'],
      }),
    },
    {
      score: scoreKeywords(q, ['budget', 'expense', 'save', 'kharcha', 'bachao', 'saving']),
      response: () => ({
        text: `${name}, saving tips:\n\n📋 Track every rupee for 30 days\n\nCut karo:\n• Subscriptions you don't use\n• Impulse online shopping\n• Eating out frequency\n\n50-30-20 Rule:\n• 50% Needs: ₹${Math.round(income * 0.5).toLocaleString('en-IN')}\n• 30% Wants: ₹${Math.round(income * 0.3).toLocaleString('en-IN')}\n• 20% Save/Invest: ₹${Math.round(income * 0.2).toLocaleString('en-IN')}\n\n💡 \"Pay yourself first\" — salary aate hi invest karo!`,
        suggestions: ['Budget app suggest karo', 'Expenses kaise track karein?', 'Kitna save karun?'],
      }),
    },
    {
      score: scoreKeywords(q, ['loan', 'emi', 'debt', 'credit card', 'udhar', 'karza']),
      response: () => ({
        text: `${name}, debt management important hai!\n\nPriority:\n1. Credit card debt — pehle band karo (36-42% interest!)\n2. Personal loan — jaldi close karo\n3. Home/Education loan — OK, tax benefit bhi\n\nRule: Total EMI < 30% income\nAapke liye max EMI: ₹${Math.round(income * 0.3).toLocaleString('en-IN')}\n\n💡 Debt free hone ke baad hi aggressive investing karo.`,
        suggestions: ['Loan prepay karun?', 'Credit card tips', 'Good debt vs bad debt?'],
      }),
    },
  ];

  // Find best matching topic
  const sorted = topics.filter(t => t.score > 0).sort((a, b) => b.score - a.score);
  if (sorted.length > 0) {
    return sorted[0].response();
  }

  // Greeting detection
  if (scoreKeywords(q, ['hi', 'hello', 'namaste', 'hey', 'hola', 'kaise ho', 'how are']) > 0) {
    return {
      text: `${name}! Kaise hain aap? 😊\n\nMain aapka Nivesh Saathi hoon — investing ke baare mein kuch bhi pucho!\n\nYeh try karo:`,
      suggestions: [
        'Mera plan review karo',
        'SIP kaise start karun?',
        'Tax kaise bachaye?',
        'Emergency fund banao',
      ],
    };
  }

  // Thank you detection
  if (scoreKeywords(q, ['thanks', 'thank', 'shukriya', 'dhanyavad', 'helpful']) > 0) {
    return {
      text: `${name}, aapki madad karke achha laga! 😊\n\nAur koi sawaal ho toh puchiye — main yahan hoon.\n\nRemember: Consistency > Perfection in investing! 🎯`,
      suggestions: [
        'Aur kuch poochna hai',
        'Mera portfolio review karo',
        'Aaj kya invest karun?',
      ],
    };
  }

  // Default — smarter default response
  return {
    text: `${name}, yeh topic interesting hai! 🤔\n\nMain specifically inn topics pe expert hoon:\n\n• 📊 SIP & Mutual Funds\n• 🛡️ Emergency Fund Planning\n• 💸 Tax Saving (80C, 80D)\n• 🏠 Goal Planning\n• 📈 Market & Portfolio\n• 🏦 FD, Gold, Insurance\n• 💰 Budgeting & Saving\n\nKoi specific financial sawaal puchiye!`,
    suggestions: [
      'SIP shuru karna hai',
      'Tax bachana hai',
      'Goal plan banao',
      'Portfolio review karo',
    ],
  };
}

function scoreKeywords(query: string, keywords: string[]): number {
  let score = 0;
  for (const kw of keywords) {
    if (query.includes(kw)) {
      score += kw.length; // Longer keyword matches = higher score
    }
  }
  return score;
}

// ═══════════════════════════════════════════
// Main export — tries OpenAI first, falls back to offline
// ═══════════════════════════════════════════
export async function getAIResponseAsync(
  query: string,
  user: UserProfile | null,
  conversationHistory: { role: string; content: string }[] = [],
  portfolioContext?: { investments: Investment[]; buckets: MoneyBucket[]; goals: Goal[] },
): Promise<AIResponse> {
  // Build portfolio summary from real data
  let portfolioSummary: string | undefined;
  if (user && portfolioContext && portfolioContext.investments.length > 0) {
    const analysis = analyzePortfolio(user, portfolioContext.investments, portfolioContext.buckets, portfolioContext.goals);
    portfolioSummary = analysis.summaryForAI;
  }

  // Try OpenAI first with full portfolio context
  const aiResponse = await callOpenAI(query, user, conversationHistory, portfolioSummary);
  if (aiResponse) return aiResponse;

  // Fallback to offline
  return getOfflineResponse(query, user);
}

// Synchronous version for backward compatibility
export function getAIResponse(query: string, user: UserProfile | null): AIResponse {
  return getOfflineResponse(query, user);
}

// Generate smart daily nudge
export function getDailyNudge(user: UserProfile | null): string {
  const name = user?.name || 'Dost';
  const investable = user ? Math.max(0, user.monthlyIncome - user.monthlyExpense) : 10000;
  const nudges = [
    `${name}, chai pe ₹30 bach gaye? Growth Pocket mein daal dein? ☕`,
    `Naya mahina, nayi SIP! ₹${Math.round(investable * 0.1).toLocaleString('en-IN')} invest karo aaj 📅`,
    `Market dip = Sale! Smart investors buy when others fear 📉➡️📈`,
    `Emergency fund check: 6 months expenses saved? Let's build it 💪`,
    `Weekend plan cancel? Wo ₹500 invest kar dein? 🎬`,
    `Salary aai? Pehle invest ₹${Math.round(investable * 0.2).toLocaleString('en-IN')}, phir kharcha 🤑`,
    `₹100/day × 365 days = ₹36,500/yr invested = ₹7L+ in 10 years! 🌳`,
    `Small steps, big wealth. Aaj invest karo, kal ka stress khatam ✨`,
    `Online shopping cart mein kuch hai? Cancel karo, invest karo! 🛒→📈`,
    `Zomato order ₹300 ka? Ghar pe banao, ₹200 invest karo! 🍳`,
  ];

  const today = new Date().getDate() + new Date().getMonth();
  return nudges[today % nudges.length];
}

export function getBucketExplanation(riskLevel: RiskLevel, investable: number): string {
  const configs = {
    safe: { safe: 60, growth: 35, opp: 5 },
    balanced: { safe: 40, growth: 45, opp: 15 },
    aggressive: { safe: 20, growth: 45, opp: 35 },
  };
  const config = configs[riskLevel];
  const safeAmt = Math.round(investable * config.safe / 100);
  const growthAmt = Math.round(investable * config.growth / 100);
  const oppAmt = Math.round(investable * config.opp / 100);

  return `Aapke ₹${investable.toLocaleString('en-IN')}/month ka smart plan:\n\n🟢 Safe Pocket: ₹${safeAmt.toLocaleString('en-IN')} (${config.safe}%)\n   → Liquid Fund / FD\n\n🟡 Growth Pocket: ₹${growthAmt.toLocaleString('en-IN')} (${config.growth}%)\n   → SIP in Mutual Funds\n\n🔴 Opportunity: ₹${oppAmt.toLocaleString('en-IN')} (${config.opp}%)\n   → Stocks / Small Cap`;
}

