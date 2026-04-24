import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import DashboardCard from '../components/DashboardCard';
import { Colors } from '../theme/colors';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const events = [
  { time: '09:00', title: 'Planning review', detail: 'Team sync and priorities' },
  { time: '11:30', title: 'Design check-in', detail: 'Review the new tab layout' },
  { time: '15:00', title: 'Deep work block', detail: 'Finish the dashboard polish' },
  { time: '18:30', title: 'Evening reset', detail: 'Plan tomorrow and reflect' },
];

export default function CalendarScreen() {
  const topInset = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
  const bottomInset = Platform.OS === 'android' ? 24 : 16;

  return (
    <SafeAreaView style={[styles.container, { paddingTop: topInset + 8, paddingBottom: bottomInset }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>My Calendar</Text>
        <Text style={styles.title}>Plan the week</Text>
        <Text style={styles.subtitle}>Keep the important blocks visible so the day feels organized, not crowded.</Text>

        <DashboardCard title="Week View">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.dayRow}>
              {days.map((day, index) => {
                const active = index === 3;
                return (
                  <View key={day} style={[styles.dayChip, active && styles.dayChipActive]}>
                    <Text style={[styles.dayText, active && styles.dayTextActive]}>{day}</Text>
                    <Text style={[styles.dayNumber, active && styles.dayTextActive]}>{index + 8}</Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </DashboardCard>

        <Text style={styles.sectionTitle}>Agenda</Text>
        {events.map((event, index) => (
          <DashboardCard key={event.time} style={styles.eventCard}>
            <View style={styles.eventRow}>
              <View style={styles.timeColumn}>
                <Text style={styles.eventTime}>{event.time}</Text>
                <View style={styles.timelineDot} />
                {index !== events.length - 1 && <View style={styles.timelineLine} />}
              </View>
              <View style={styles.eventBody}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventDetail}>{event.detail}</Text>
              </View>
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
  dayRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dayChip: {
    width: 72,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  dayChipActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.14)',
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  dayText: {
    color: Colors.gray,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  dayTextActive: {
    color: Colors.gold,
  },
  dayNumber: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 6,
  },
  eventCard: {
    marginBottom: 14,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  timeColumn: {
    width: 56,
    alignItems: 'center',
    position: 'relative',
  },
  eventTime: {
    color: Colors.gold,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.gold,
    zIndex: 2,
  },
  timelineLine: {
    position: 'absolute',
    top: 26,
    bottom: -24,
    width: 2,
    backgroundColor: 'rgba(212, 175, 55, 0.18)',
  },
  eventBody: {
    flex: 1,
  },
  eventTitle: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  eventDetail: {
    color: Colors.gray,
    fontSize: 13,
    lineHeight: 18,
  },
});
