// Hinglish strings - Natural Bharat language mix
export const Strings = {
  app: {
    name: 'Nivesh Saathi',
    tagline: 'Aapka AI Money Buddy 🤝',
    subtitle: 'Smart investing, simple language',
  },

  onboarding: {
    welcome: 'Namaste! 🙏\nMain hoon aapka Nivesh Saathi',
    welcomeSub: 'Aapki money journey mein aapka companion',
    askName: 'Pehle batayiye, aapka naam kya hai? 😊',
    greetUser: (name: string) => `Bahut achha ${name}! Chaliye shuru karte hain 🚀`,
    askAge: 'Aapki age kya hai? Yeh help karega sahi plan banane mein',
    askIncome: 'Monthly income kitni hai roughly?\n(Don\'t worry, yeh bilkul private hai 🔒)',
    askExpense: 'Aur monthly kharcha kitna hota hai approx?',
    askGoal: 'Sabse important goal kya hai aapka?\n\n🏠 Ghar khareedna\n🎓 Bachche ki padhai\n🚗 Gaadi lena\n✈️ Holiday trip\n💰 Emergency fund\n📈 Paisa grow karna',
    askRisk: 'Risk lena pasand hai ya safe rehna?\n\n🛡️ Safe - \"Paisa safe rahe, slow growth chalega\"\n⚖️ Balanced - \"Thoda risk ok hai\"\n🚀 Aggressive - \"Zyada return chahiye, risk le lunga\"',
    planReady: (name: string) => `${name}, aapka Money Plan ready hai! 🎉\nAb dekhiye kaise aapka paisa grow hoga 🌱`,
  },

  home: {
    greeting: (name: string, hour: number) => {
      if (hour < 12) return `Good Morning, ${name}! ☀️`;
      if (hour < 17) return `Good Afternoon, ${name}! 🌤️`;
      return `Good Evening, ${name}! 🌙`;
    },
    totalWealth: 'Aapki Total Wealth',
    monthlyInvestable: 'Monthly Investable',
    safePocket: 'Safe Pocket 🟢',
    safePocketDesc: 'Emergency Fund • Liquid Funds',
    growthPocket: 'Growth Pocket 🟡',
    growthPocketDesc: 'SIP • Mutual Funds • Goals',
    opportunityPocket: 'Opportunity Pocket 🔴',
    opportunityPocketDesc: 'High Growth • Stocks',
    moneyGarden: 'Money Garden 🌱',
    aiNudge: 'AI Nudge',
    viewAll: 'Sab dekhein →',
  },

  chat: {
    placeholder: 'Apna sawaal puchiye...',
    title: 'Goal Mitra 🤖',
    subtitle: 'Aapka AI Financial Advisor',
    thinking: 'Soch raha hoon... 🤔',
    suggestions: [
      'Mera paisa kaise grow hoga?',
      'Emergency fund kitna hona chahiye?',
      'SIP kya hota hai?',
      'Tax kaise bachaye?',
      'Bachche ki padhai ke liye plan',
      'Ghar khareedne ka plan banao',
    ],
  },

  goals: {
    title: 'Mere Goals 🎯',
    addGoal: '+ Naya Goal',
    onTrack: 'On Track ✅',
    behind: 'Peeche hai ⚠️',
    ahead: 'Aage hai 🚀',
    completed: 'Complete! 🎉',
  },

  nudges: [
    'Aaj chai pe ₹30 bach gaye? Growth Pocket mein daal dein? ☕',
    'Kal se naya mahina! SIP invest ho gayi? 📅',
    'Market thoda neeche hai - opportunity hai invest karne ki! 📉➡️📈',
    'Aapka emergency fund 80% complete hai! Thoda aur? 💪',
    'Weekend plan cancel hua? Wo ₹500 invest kar dein? 🎬',
    'Salary aai hogi! Pehle invest, phir kharcha 🤑',
    'Aapka Goal Mitra kehta hai - aaj ₹100 invest karo, 10 saal mein ₹3000+ banega! 🌳',
  ],

  tabs: {
    home: 'Home',
    goals: 'Goals',
    chat: 'Saathi',
    garden: 'Garden',
    profile: 'Profile',
  },

  common: {
    next: 'Aage badhein →',
    skip: 'Skip',
    done: 'Ho gaya!',
    invest: 'Invest karo',
    cancel: 'Rehne do',
    confirm: 'Haan, kar do! ✅',
    rupee: '₹',
  },
};

