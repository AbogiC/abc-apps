import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import DashboardCard from '../components/DashboardCard';
import { Colors } from '../theme/colors';

const stats = [
  { label: 'Streak', value: '18 days' },
  { label: 'Notes', value: '42' },
  { label: 'Events', value: '11' },
];

const settings = [
  { icon: 'bell', label: 'Notifications' },
  { icon: 'lock', label: 'Privacy' },
  { icon: 'help-circle', label: 'Support' },
];

export default function ProfileScreen() {
  const topInset = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
  const bottomInset = Platform.OS === 'android' ? 24 : 16;

  return (
    <SafeAreaView style={[styles.container, { paddingTop: topInset + 8, paddingBottom: bottomInset }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>Profile</Text>
        <Text style={styles.title}>Your space</Text>
        <Text style={styles.subtitle}>Keep track of your progress and personal settings in one calm place.</Text>

        <DashboardCard style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>AM</Text>
          </View>
          <Text style={styles.name}>Alexander Mitchell</Text>
          <Text style={styles.role}>Premium Member</Text>
        </DashboardCard>

        <View style={styles.statsRow}>
          {stats.map((item) => (
            <DashboardCard key={item.label} style={styles.statsCard}>
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </DashboardCard>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Preferences</Text>
        {settings.map((item) => (
          <DashboardCard key={item.label} style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingIcon}>
                <Feather name={item.icon} size={18} color={Colors.gold} />
              </View>
              <Text style={styles.settingLabel}>{item.label}</Text>
              <Feather name="chevron-right" size={16} color={Colors.gray} />
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
  profileCard: {
    alignItems: 'center',
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gold,
    marginBottom: 12,
  },
  avatarText: {
    color: Colors.primary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  name: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  role: {
    color: Colors.gray,
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
    marginBottom: 6,
    gap: 10,
  },
  statsCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
  },
  statValue: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: Colors.gray,
    fontSize: 12,
  },
  sectionTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
  },
  settingCard: {
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  settingLabel: {
    flex: 1,
    color: Colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
});
