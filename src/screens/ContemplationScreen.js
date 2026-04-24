import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import DashboardCard from '../components/DashboardCard';
import { Colors } from '../theme/colors';

const prompts = [
  'What is one thing I can release today?',
  'What deserves my attention most right now?',
  'What would make this evening feel peaceful?',
];

export default function ContemplationScreen() {
  const topInset = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
  const bottomInset = Platform.OS === 'android' ? 24 : 16;

  return (
    <SafeAreaView style={[styles.container, { paddingTop: topInset + 8, paddingBottom: bottomInset }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>Contemplation</Text>
        <Text style={styles.title}>Slow the pace</Text>
        <Text style={styles.subtitle}>A quiet corner for reflection, breathing, and a cleaner mental reset.</Text>

        <DashboardCard title="Breathing Reset">
          <View style={styles.breathingRow}>
            <View style={styles.breathingCircle}>
              <Feather name="wind" size={22} color={Colors.gold} />
            </View>
            <View style={styles.breathingText}>
              <Text style={styles.breathingTitle}>4 in, 4 hold, 6 out</Text>
              <Text style={styles.breathingBody}>Use this when the day feels noisy and you need a fast reset.</Text>
            </View>
          </View>
        </DashboardCard>

        <Text style={styles.sectionTitle}>Reflection Prompts</Text>
        {prompts.map((prompt, index) => (
          <DashboardCard key={prompt} style={styles.promptCard}>
            <View style={styles.promptRow}>
              <View style={styles.promptIndex}>
                <Text style={styles.promptIndexText}>0{index + 1}</Text>
              </View>
              <Text style={styles.promptText}>{prompt}</Text>
            </View>
          </DashboardCard>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
  },
  kicker: {
    color: Colors.gold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    color: Colors.white,
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.gray,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
  breathingRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  breathingCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
  },
  breathingText: {
    flex: 1,
  },
  breathingTitle: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  breathingBody: {
    color: Colors.gray,
    fontSize: 13,
    lineHeight: 19,
  },
  sectionTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 6,
  },
  promptCard: {
    marginBottom: 14,
  },
  promptRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  promptIndex: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  promptIndexText: {
    color: Colors.gold,
    fontSize: 12,
    fontWeight: '700',
  },
  promptText: {
    flex: 1,
    color: Colors.white,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
});
