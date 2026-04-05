import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

interface Lesson {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  content: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  readTime: string;
}

const LESSONS: Lesson[] = [
  {
    id: '1', emoji: '📊', title: 'SIP Kya Hai?',
    subtitle: 'Systematic Investment Plan samjho',
    difficulty: 'Beginner', readTime: '3 min',
    content: `SIP = Systematic Investment Plan\n\nJaise aap har mahine rent dete ho, waise hi har mahine ek fixed amount mutual fund mein invest hota hai.\n\n✅ Benefits:\n• Small amount se start (₹500 bhi chalega)\n• Rupee cost averaging — market upar ho ya neeche\n• Discipline banta hai\n• Compounding ka magic\n\n📌 Example:\n₹5,000/month × 10 years @ 12% = ~₹11.6 Lakh\nAapne daala: ₹6 Lakh\nProfit: ~₹5.6 Lakh!\n\n💡 Tip: SIP ko EMI samjho — lekin yeh EMI aapko ameer banati hai!`,
  },
  {
    id: '2', emoji: '🏦', title: 'Mutual Fund Basics',
    subtitle: 'Fund types aur kaise kaam karta hai',
    difficulty: 'Beginner', readTime: '4 min',
    content: `Mutual Fund = Bahut logo ka paisa ek jagah collect karke professionally invest karna.\n\n📋 Types:\n\n1. Equity Fund (High risk, high return)\n   • Large Cap — Reliance, TCS type companies\n   • Mid Cap — Growing companies\n   • Small Cap — Chhoti companies, zyada risk\n\n2. Debt Fund (Low risk)\n   • Liquid Fund — FD jaisa, instant withdrawal\n   • Bond Fund — Government/Corporate bonds\n\n3. Hybrid Fund (Mix)\n   • Balanced Advantage — Automatic equity/debt mix\n\n4. Index Fund (Recommended!)\n   • Nifty 50 ko copy karta hai\n   • Low cost, good returns\n\n💡 Beginner ke liye: Nifty 50 Index Fund se start karo!`,
  },
  {
    id: '3', emoji: '🛡️', title: 'Emergency Fund Guide',
    subtitle: 'Pehle safety net, phir investing',
    difficulty: 'Beginner', readTime: '3 min',
    content: `Emergency Fund = 6 months ka kharcha alag rakhna\n\n❓ Kyun zaroori hai?\n• Job loss ho toh 6 months chalega\n• Medical emergency cover\n• Peace of mind — no panic selling\n\n📏 Kitna rakhna hai:\n• Single income: 6-8 months expenses\n• Dual income: 3-6 months expenses\n• Freelancer: 8-12 months expenses\n\n🏦 Kahan rakhein:\n1. Liquid Fund (Best!) — 6-7% returns, instant withdrawal\n2. Savings Account — easy access but 3-4% return\n3. FD — OK but penalty on early withdrawal\n\n💡 Pehle emergency fund banao, phir SIP shuru karo!`,
  },
  {
    id: '4', emoji: '💸', title: 'Tax Saving 101',
    subtitle: 'Smart tax planning for salaried',
    difficulty: 'Intermediate', readTime: '5 min',
    content: `Tax bachao, paisa bachao! 🏷️\n\n📋 Section 80C (₹1.5 Lakh limit):\n• ELSS Mutual Fund ⭐ — 3yr lock, 12-15% returns\n• PPF — 15yr lock, 7.1% guaranteed\n• EPF — Already hota hai salary se\n• Life Insurance Premium\n• Home Loan Principal\n\n📋 Section 80D (Health Insurance):\n• Self: ₹25,000\n• Parents (60+): ₹50,000\n• Total: Upto ₹1,00,000\n\n📋 Other Deductions:\n• NPS 80CCD(1B): Extra ₹50,000\n• HRA: Rent receipt se claim\n• Education Loan Interest: 80E\n\n💡 Best strategy: ₹12,500/month ELSS SIP = Full 80C done + wealth creation!`,
  },
  {
    id: '5', emoji: '📈', title: 'Power of Compounding',
    subtitle: '8th wonder of the world!',
    difficulty: 'Beginner', readTime: '3 min',
    content: `Einstein ne kaha: \"Compound interest is the 8th wonder of the world.\"\n\n🎯 Simple Example:\n₹1,00,000 @ 12% compounding:\n• 10 years → ₹3.1 Lakh (3x)\n• 20 years → ₹9.6 Lakh (10x)\n• 30 years → ₹30 Lakh (30x!)\n\n⏰ Time is EVERYTHING:\n• Age 25 se ₹5K/month = ₹1.5 Cr at 55\n• Age 35 se ₹5K/month = ₹50 Lakh at 55\n• 10 saal delay = ₹1 Crore loss!\n\n💡 Rules:\n1. Jaldi start karo\n2. Regularly invest karo\n3. Long term hold karo\n4. Returns reinvest karo\n\nCompounding slow shuru hota hai but end mein ROCKET jaisa!`,
  },
  {
    id: '6', emoji: '⚖️', title: 'Risk Management',
    subtitle: 'Risk samjho, kamao zyada',
    difficulty: 'Intermediate', readTime: '4 min',
    content: `Risk = Loss hone ka chance. But NO risk = NO growth!\n\n📊 Risk Levels:\n• FD/PPF: Low risk, ~7% return\n• Debt Funds: Low-Medium, ~8-9%\n• Large Cap: Medium, ~12-14%\n• Mid Cap: Medium-High, ~14-16%\n• Small Cap: High, ~16-20%\n\n🛡️ Risk Management Tips:\n\n1. Diversify: Ek basket mein sab eggs mat rakho\n2. Asset Allocation: Age ke hisaab se mix karo\n   • Equity % = 100 - Your Age\n   • 25 yrs = 75% equity, 25% debt\n3. SIP karo: Timing ki tension nahi\n4. Long term: 5+ years hold karo\n5. Emergency fund rakho: Panic sell avoid karo\n\n💡 Risk avoid mat karo — manage karo!`,
  },
  {
    id: '7', emoji: '🏠', title: 'Ghar Khareedna vs Rent',
    subtitle: 'Biggest financial decision',
    difficulty: 'Advanced', readTime: '5 min',
    content: `Buy vs Rent — kya sahi hai?\n\n📊 Rent ke favors:\n• Flexibility — move easily\n• No maintenance headache\n• Extra money invest kar sakte ho\n• No EMI stress\n\n📊 Buy ke favors:\n• Asset creation — apna ghar\n• Rent nahi dena padega\n• Tax benefits on home loan\n• Emotional security\n\n📏 Rule of Thumb:\nIf Property Price > 200x Monthly Rent → RENT\nIf Property Price < 200x Monthly Rent → BUY\n\n⚡ Smart approach:\n1. Home loan EMI < 30% income\n2. Down payment 20% ready rakhein\n3. Total cost = Price + Registration + Interior\n4. Buy only if 7+ years rehna hai\n\n💡 Financial answer: Rent karo, equity invest karo.\nEmotional answer: Apna ghar buy karo!`,
  },
  {
    id: '8', emoji: '🌍', title: 'Index Fund Investing',
    subtitle: 'Simple, effective, low cost',
    difficulty: 'Intermediate', readTime: '4 min',
    content: `Index Fund = Stock market ka \"default\" option\n\nNifty 50 Index Fund:\n• India ki top 50 companies\n• Reliance, TCS, HDFC, Infosys etc.\n• Historical return: ~12-14% p.a.\n• Very low expense ratio (0.1-0.2%)\n\n✅ Why Index Fund?\n1. No fund manager risk — follows the index\n2. Low cost — 10x cheaper than active funds\n3. Diversified — 50 companies in 1 fund\n4. Historically beats 80% active funds!\n\n📋 Best Index Funds:\n• UTI Nifty 50 Index Fund (Direct)\n• Nippon Nifty Bees ETF\n• Motilal Oswal Nifty Next 50\n\n💡 Warren Buffett's advice: \"Just buy index funds!\"\n\nStart with ₹500/month SIP. Bas. Done.`,
  },
];

export default function LearnScreen({ navigation }: any) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('All');

  const filtered = filter === 'All'
    ? LESSONS
    : LESSONS.filter(l => l.difficulty === filter);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <LinearGradient colors={['#0B0B0F', '#111118']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Learn Investing 📚</Text>
        <Text style={styles.headerSub}>Simple lessons in Hinglish</Text>
      </LinearGradient>

      {/* Filter */}
      <View style={styles.filterRow}>
        {['All', 'Beginner', 'Intermediate', 'Advanced'].map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {filtered.map(lesson => (
          <TouchableOpacity
            key={lesson.id}
            style={styles.lessonCard}
            onPress={() => setExpandedId(expandedId === lesson.id ? null : lesson.id)}
            activeOpacity={0.85}
          >
            <View style={styles.lessonHeader}>
              <View style={styles.lessonEmoji}>
                <Text style={styles.lessonEmojiText}>{lesson.emoji}</Text>
              </View>
              <View style={styles.lessonInfo}>
                <Text style={styles.lessonTitle}>{lesson.title}</Text>
                <Text style={styles.lessonSub}>{lesson.subtitle}</Text>
              </View>
              <View style={styles.lessonMeta}>
                <Text style={styles.lessonTime}>{lesson.readTime}</Text>
                <View style={[
                  styles.diffBadge,
                  lesson.difficulty === 'Beginner' && { backgroundColor: 'rgba(52,211,153,0.12)' },
                  lesson.difficulty === 'Intermediate' && { backgroundColor: 'rgba(251,191,36,0.12)' },
                  lesson.difficulty === 'Advanced' && { backgroundColor: 'rgba(244,114,182,0.12)' },
                ]}>
                  <Text style={[
                    styles.diffText,
                    lesson.difficulty === 'Beginner' && { color: '#2E7D32' },
                    lesson.difficulty === 'Intermediate' && { color: '#E65100' },
                    lesson.difficulty === 'Advanced' && { color: '#C62828' },
                  ]}>{lesson.difficulty}</Text>
                </View>
              </View>
            </View>

            {expandedId === lesson.id && (
              <View style={styles.lessonContent}>
                <View style={styles.divider} />
                <Text style={styles.contentText}>{lesson.content}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B0F' },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#0B0B0F',
  },
  backBtn: { marginBottom: 8 },
  backText: { color: '#6B7280', fontSize: 14, fontWeight: '600' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#F0F0F5', letterSpacing: -0.5 },
  headerSub: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: 18, paddingVertical: 12, gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#111118', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  filterActive: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  filterTextActive: { color: '#FFF' },
  content: { padding: 18 },
  lessonCard: {
    backgroundColor: '#111118', borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  lessonHeader: { flexDirection: 'row', alignItems: 'center' },
  lessonEmoji: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#1E1E28',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  lessonEmojiText: { fontSize: 22 },
  lessonInfo: { flex: 1 },
  lessonTitle: { fontSize: 15, fontWeight: '700', color: '#F0F0F5' },
  lessonSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  lessonMeta: { alignItems: 'flex-end' },
  lessonTime: { fontSize: 11, color: '#6B7280', marginBottom: 4 },
  diffBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  diffText: { fontSize: 10, fontWeight: '700' },
  lessonContent: { marginTop: 10 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginBottom: 12 },
  contentText: { fontSize: 14, color: '#9CA3AF', lineHeight: 22 },
});

