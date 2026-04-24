import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { onAuthStateChanged } from 'firebase/auth';

import DashboardCard from '../components/DashboardCard';
import { Colors } from '../theme/colors';
import { auth } from '../services/firebaseService';
import { getTasks } from '../services/notesTaskStorageService';
import { getContemplations } from '../services/contemplationStorageService';
import { listenToCalendarEvents } from '../services/calendarService';

const PRIORITY_ORDER = ['High', 'Medium', 'Low'];

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isSameOrAfter(a, b) {
  return new Date(a).getTime() >= new Date(b).getTime();
}

function isSameOrBefore(a, b) {
  return new Date(a).getTime() <= new Date(b).getTime();
}

function formatEventDate(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export default function DashboardScreen() {
  const topInset = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
  const bottomInset = Platform.OS === 'android' ? 24 : 16;

  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [tasks, setTasks] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [latestContemplation, setLatestContemplation] = useState(null);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingContemplations, setLoadingContemplations] = useState(true);

  const displayName = currentUser?.displayName?.trim() || currentUser?.email?.split('@')?.[0] || '';
  const showWelcomeBack = Boolean(currentUser);

  const taskCounts = useMemo(() => {
    const counts = { High: 0, Medium: 0, Low: 0 };

    tasks.forEach((task) => {
      if (counts[task.priority] !== undefined) {
        counts[task.priority] += 1;
      }
    });

    return PRIORITY_ORDER.map((priority) => ({
      priority,
      count: counts[priority] ?? 0,
    }));
  }, [tasks]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadLocalData = async () => {
      try {
        setLoadingTasks(true);
        const nextTasks = await getTasks();
        if (mounted) {
          setTasks(nextTasks);
        }
      } finally {
        if (mounted) {
          setLoadingTasks(false);
        }
      }

      try {
        setLoadingContemplations(true);
        const contemplations = await getContemplations();
        if (mounted) {
          setLatestContemplation(contemplations[0] ?? null);
        }
      } finally {
        if (mounted) {
          setLoadingContemplations(false);
        }
      }
    };

    loadLocalData();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!currentUser?.uid) {
      setUpcomingEvents([]);
      return undefined;
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const oneMonthLater = new Date(now);
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

    const unsubscribe = listenToCalendarEvents(
      currentUser.uid,
      (events) => {
        const filteredEvents = events
          .filter((event) => {
            if (!event.startAt) {
              return false;
            }

            return isSameOrAfter(event.startAt, now) && isSameOrBefore(event.startAt, oneMonthLater);
          })
          .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
          .slice(0, 5);

        setUpcomingEvents(filteredEvents);
      },
      () => {
        setUpcomingEvents([]);
      }
    );

    return unsubscribe;
  }, [currentUser?.uid]);

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          paddingTop: topInset + 8,
          paddingBottom: 2 * bottomInset,
        },
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerCopy}>
            <Text style={styles.greeting}>{showWelcomeBack ? 'Welcome back,' : 'Welcome!'}</Text>
            {showWelcomeBack ? <Text style={styles.name}>{displayName || 'User'}</Text> : null}
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Feather name="bell" size={22} color={Colors.gold} />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {showWelcomeBack ? getInitials(displayName || currentUser?.email || '') : '!'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <DashboardCard title="Task Preview">
          {loadingTasks ? (
            <Text style={styles.helperText}>Loading tasks...</Text>
          ) : (
            <View style={styles.priorityList}>
              {taskCounts.map((item) => (
                <View key={item.priority} style={styles.priorityRow}>
                  <View style={styles.priorityDotWrap}>
                    <View
                      style={[
                        styles.priorityDot,
                        item.priority === 'High'
                          ? styles.priorityDotHigh
                          : item.priority === 'Medium'
                            ? styles.priorityDotMedium
                            : styles.priorityDotLow,
                      ]}
                    />
                    <Text style={styles.priorityLabel}>{item.priority}</Text>
                  </View>
                  <Text style={styles.priorityCount}>{item.count} task{item.count === 1 ? '' : 's'}</Text>
                </View>
              ))}
            </View>
          )}
        </DashboardCard>

        <DashboardCard title="Upcoming Events">
          {!currentUser ? (
            <Text style={styles.helperText}>You need to login to see upcoming event!</Text>
          ) : upcomingEvents.length === 0 ? (
            <Text style={styles.helperText}>No upcoming events in the next month.</Text>
          ) : (
            upcomingEvents.map((event) => (
              <View key={event.id} style={styles.eventRow}>
                <View style={styles.eventDot} />
                <View style={styles.eventBody}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventMeta}>
                    {formatEventDate(event.startAt)}{event.detail ? ` • ${event.detail}` : ''}
                  </Text>
                </View>
              </View>
            ))
          )}
        </DashboardCard>

        <DashboardCard title="Last Contemplation">
          {loadingContemplations ? (
            <Text style={styles.helperText}>Loading contemplation...</Text>
          ) : latestContemplation ? (
            <View>
              <View style={styles.contemplationHeader}>
                <Text style={styles.contemplationTitle}>{latestContemplation.title}</Text>
                <View style={styles.contemplationBadge}>
                  <Text style={styles.contemplationBadgeText}>{latestContemplation.mood}</Text>
                </View>
              </View>
              <Text style={styles.contemplationBody}>{latestContemplation.contemplation}</Text>
            </View>
          ) : (
            <Text style={styles.helperText}>No contemplation saved yet.</Text>
          )}
        </DashboardCard>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerCopy: {
    flex: 1,
    paddingRight: 16,
  },
  greeting: {
    color: Colors.gray,
    fontSize: 14,
    marginBottom: 4,
  },
  name: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  avatarContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  helperText: {
    color: Colors.gray,
    fontSize: 13,
    lineHeight: 19,
  },
  priorityList: {
    gap: 12,
  },
  priorityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityDotWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  priorityDotHigh: {
    backgroundColor: Colors.warning,
  },
  priorityDotMedium: {
    backgroundColor: Colors.gold,
  },
  priorityDotLow: {
    backgroundColor: Colors.success,
  },
  priorityLabel: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  priorityCount: {
    color: Colors.gray,
    fontSize: 13,
    fontWeight: '600',
  },
  eventRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  eventDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.gold,
    marginTop: 5,
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
  eventMeta: {
    color: Colors.gray,
    fontSize: 12,
    lineHeight: 18,
  },
  contemplationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  contemplationTitle: {
    flex: 1,
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  contemplationBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  contemplationBadgeText: {
    color: Colors.gold,
    fontSize: 11,
    fontWeight: '700',
  },
  contemplationBody: {
    color: Colors.gray,
    fontSize: 13,
    lineHeight: 19,
  },
  bottomSpacer: {
    height: 30,
  },
});
