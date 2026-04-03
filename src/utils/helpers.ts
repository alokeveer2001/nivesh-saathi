export function formatCurrency(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)} L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatFullCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function getProgressPercent(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

export function getPlantStage(progress: number): 'seed' | 'sprout' | 'sapling' | 'tree' | 'fruit_tree' {
  if (progress < 10) return 'seed';
  if (progress < 30) return 'sprout';
  if (progress < 60) return 'sapling';
  if (progress < 90) return 'tree';
  return 'fruit_tree';
}

export function getPlantEmoji(stage: string): string {
  switch (stage) {
    case 'seed': return '🌰';
    case 'sprout': return '🌱';
    case 'sapling': return '🌿';
    case 'tree': return '🌳';
    case 'fruit_tree': return '🌳✨';
    default: return '🌱';
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function getGreeting(name: string): string {
  const hour = new Date().getHours();
  if (hour < 12) return `Good Morning, ${name}! ☀️`;
  if (hour < 17) return `Good Afternoon, ${name}! 🌤️`;
  return `Good Evening, ${name}! 🌙`;
}

export function calculateFutureValue(monthlyAmount: number, annualRate: number, years: number): number {
  const monthlyRate = annualRate / 100 / 12;
  const months = years * 12;
  return Math.round(monthlyAmount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
}

export function parseAmount(text: string): number {
  const cleaned = text.replace(/[₹,\s]/g, '').toLowerCase();

  if (cleaned.includes('lakh') || cleaned.includes('lac') || cleaned.includes('l')) {
    const num = parseFloat(cleaned.replace(/[a-z]/g, ''));
    return num * 100000;
  }
  if (cleaned.includes('cr')) {
    const num = parseFloat(cleaned.replace(/[a-z]/g, ''));
    return num * 10000000;
  }
  if (cleaned.includes('k') || cleaned.includes('thousand')) {
    const num = parseFloat(cleaned.replace(/[a-z]/g, ''));
    return num * 1000;
  }

  return parseInt(cleaned) || 0;
}

