import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Animated,
  Easing,
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

// Animated Components
const AnimatedCard = ({ children, index, style }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: index * 200,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay: index * 200,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.2)),
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};

const AnimatedPriorityRow = ({ item, index }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay: 300 + index * 100,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        delay: 300 + index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.priorityRow,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
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
    </Animated.View>
  );
};

export default function DashboardScreen() {
  const topInset = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
  const bottomInset = Platform.OS === 'android' ? 24 : 16;

  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [tasks, setTasks] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [latestContemplation, setLatestContemplation] = useState(null);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingContemplations, setLoadingContemplations] = useState(true);

  // Animation values for header
  const headerFadeAnim = useRef(new Animated.Value(0)).current;
  const headerSlideAnim = useRef(new Animated.Value(-20)).current;
  const avatarPulseAnim = useRef(new Animated.Value(1)).current;

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

  // Header animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(headerSlideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5)),
      }),
    ]).start();
  }, []);

  // Avatar pulse animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(avatarPulseAnim, {
          toValue: 1.05,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(avatarPulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

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

      <Animated.View
        style={[
          {
            opacity: headerFadeAnim,
            transform: [{ translateY: headerSlideAnim }],
          },
        ]}
      >
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
              <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
                <Feather name="bell" size={22} color={Colors.gold} />
                <View style={styles.notificationBadge}>
                  <View style={styles.notificationBadgeInner} />
                </View>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.8}>
                <Animated.View
                  style={[
                    styles.avatarContainer,
                    {
                      transform: [{ scale: avatarPulseAnim }],
                    },
                  ]}
                >
                  <Text style={styles.avatarText}>
                    {showWelcomeBack ? getInitials(displayName || currentUser?.email || '') : '!'}
                  </Text>
                </Animated.View>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={true}
        decelerationRate="normal"
      >
        <AnimatedCard index={0}>
          <DashboardCard title="Task Preview">
            {loadingTasks ? (
              <View style={styles.loadingContainer}>
                <View style={styles.loadingShimmer} />
              </View>
            ) : (
              <View style={styles.priorityList}>
                {taskCounts.map((item, index) => (
                  <AnimatedPriorityRow key={item.priority} item={item} index={index} />
                ))}
              </View>
            )}
          </DashboardCard>
        </AnimatedCard>

        <AnimatedCard index={1}>
          <DashboardCard title="Upcoming Events">
            {!currentUser ? (
              <Text style={styles.helperText}>You need to login to see upcoming event!</Text>
            ) : upcomingEvents.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="calendar" size={32} color={Colors.gray} style={styles.emptyIcon} />
                <Text style={styles.helperText}>No upcoming events in the next month.</Text>
              </View>
            ) : (
              upcomingEvents.map((event) => (
                <TouchableOpacity key={event.id} style={styles.eventRow} activeOpacity={0.7}>
                  <View style={styles.eventDot}>
                    <View style={styles.eventDotInner} />
                  </View>
                  <View style={styles.eventBody}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventMeta}>
                      {formatEventDate(event.startAt)}{event.detail ? ` • ${event.detail}` : ''}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </DashboardCard>
        </AnimatedCard>

        <AnimatedCard index={2}>
          <DashboardCard title="Last Contemplation">
            {loadingContemplations ? (
              <View style={styles.loadingContainer}>
                <View style={styles.loadingShimmer} />
              </View>
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
              <View style={styles.emptyState}>
                <Feather name="book-open" size={32} color={Colors.gray} style={styles.emptyIcon} />
                <Text style={styles.helperText}>No contemplation saved yet.</Text>
              </View>
            )}
          </DashboardCard>
        </AnimatedCard>

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
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
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
    letterSpacing: 0.3,
  },
  name: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    position: 'relative',
    transform: [{ scale: 1 }],
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  avatarContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.gold,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
    textAlign: 'center',
  },
  priorityList: {
    gap: 12,
  },
  priorityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 8,
    borderRadius: 8,
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 10,
    borderRadius: 10,
    borderLeftWidth: 2,
    borderLeftColor: Colors.gold,
  },
  eventDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    marginTop: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.gold,
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
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  contemplationBadgeText: {
    color: Colors.gold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  contemplationBody: {
    color: Colors.gray,
    fontSize: 13,
    lineHeight: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 2,
    borderLeftColor: Colors.gold,
  },
  bottomSpacer: {
    height: 30,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  emptyIcon: {
    opacity: 0.4,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingShimmer: {
    width: '80%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
});