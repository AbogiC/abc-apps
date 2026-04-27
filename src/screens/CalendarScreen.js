import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import DashboardCard from '../components/DashboardCard';
import { Colors } from '../theme/colors';
import { auth } from '../services/firebaseService';
import {
  createCalendarEvent,
  listenToCalendarEvents,
  removeCalendarEvent,
  updateCalendarEvent,
} from '../services/calendarService';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function pad(value) {
  return String(value).padStart(2, '0');
}

function toDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map((value) => Number(value));
  return new Date(year, month - 1, day);
}

function getMonthData(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();
  
  const days = [];
  
  // Add empty cells for days before the first of the month
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null);
  }
  
  // Add actual days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }
  
  return {
    days,
    month,
    year,
    monthLabel: MONTH_LABELS[month],
    daysInMonth,
  };
}

function formatSelectedDay(dateKey) {
  const date = parseDateKey(dateKey);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function formatEventDateTime(date, time) {
  if (!date || !time) {
    return '';
  }

  const [hours, minutes] = time.split(':').map((value) => Number(value));
  const value = parseDateKey(date);
  value.setHours(hours, minutes, 0, 0);

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(value);
}

function buildStartAt(date, time) {
  if (!date || !time) {
    return null;
  }

  const [hours, minutes] = time.split(':').map((value) => Number(value));
  const value = parseDateKey(date);
  value.setHours(hours, minutes, 0, 0);
  return value;
}

function getDefaultTime(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const emptyForm = {
  title: '',
  detail: '',
  date: '',
  time: '09:00',
};

export default function CalendarScreen() {
  const topInset = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
  const bottomInset = Platform.OS === 'android' ? 24 : 16;
  const currentUser = auth.currentUser;

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDateKey, setSelectedDateKey] = useState(toDateKey(today));
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [form, setForm] = useState(() => ({
    ...emptyForm,
    date: toDateKey(today),
    time: getDefaultTime(today),
  }));

  const monthData = useMemo(() => getMonthData(currentYear, currentMonth), [currentYear, currentMonth]);
  const todayKey = useMemo(() => toDateKey(today), []);
  const selectedDate = useMemo(() => parseDateKey(selectedDateKey), [selectedDateKey]);
  
  // Get events for all dates in the current month view
  const eventsByDate = useMemo(() => {
    const eventMap = {};
    events.forEach(event => {
      if (event.date) {
        const eventDate = parseDateKey(event.date);
        if (eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear) {
          if (!eventMap[event.date]) {
            eventMap[event.date] = [];
          }
          eventMap[event.date].push(event);
        }
      }
    });
    return eventMap;
  }, [events, currentMonth, currentYear]);

  const selectedDayEvents = useMemo(() => {
    return events
      .filter((event) => event.date === selectedDateKey)
      .sort((a, b) => `${a.time}`.localeCompare(`${b.time}`));
  }, [events, selectedDateKey]);

  useEffect(() => {
    if (!currentUser?.uid) {
      setEvents([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    setError('');

    const unsubscribe = listenToCalendarEvents(
      currentUser.uid,
      (nextEvents) => {
        setEvents(nextEvents);
        setLoading(false);
      },
      (listenError) => {
        setError(listenError?.message ?? 'Could not load calendar events.');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!editingEventId) {
      setForm((current) => ({
        ...current,
        date: selectedDateKey,
      }));
    }
  }, [selectedDateKey, editingEventId]);

  const navigateMonth = (direction) => {
    let newMonth = currentMonth + direction;
    let newYear = currentYear;
    
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDateKey(toDateKey(today));
  };

  const openCreateModal = () => {
    setEditingEventId(null);
    setForm({
      title: '',
      detail: '',
      date: selectedDateKey,
      time: '09:00',
    });
    setError('');
    setModalVisible(true);
  };

  const openEditModal = (event) => {
    setEditingEventId(event.id);
    setForm({
      title: event.title ?? '',
      detail: event.detail ?? '',
      date: event.date ?? selectedDateKey,
      time: event.time ?? '09:00',
    });
    setError('');
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSaving(false);
    setError('');
  };

  const handleSaveEvent = async () => {
    if (!currentUser?.uid) {
      setError('You need to be logged in to save events.');
      return;
    }

    if (!form.title.trim()) {
      setError('Please add an event title.');
      return;
    }

    if (!form.date || !form.time) {
      setError('Please choose a date and time.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const payload = {
        title: form.title.trim(),
        detail: form.detail.trim(),
        date: form.date,
        time: form.time,
        startAt: buildStartAt(form.date, form.time),
      };

      if (editingEventId) {
        await updateCalendarEvent(currentUser.uid, editingEventId, payload);
      } else {
        await createCalendarEvent(currentUser.uid, payload);
      }

      closeModal();
    } catch (saveError) {
      setError(saveError?.message ?? 'Could not save the event.');
      setSaving(false);
    }
  };

  const confirmDeleteEvent = (event) => {
    if (!currentUser?.uid) {
      return;
    }

    Alert.alert('Delete event?', event.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeCalendarEvent(currentUser.uid, event.id);
          } catch (deleteError) {
            setError(deleteError?.message ?? 'Could not delete the event.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: topInset + 8, paddingBottom: bottomInset }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>My Calendar</Text>
        <Text style={styles.title}>Monthly Overview</Text>
        <Text style={styles.subtitle}>
          See your month at a glance. Tap any day to view or add events.
        </Text>

        <DashboardCard title="Month View">
          {/* Month Navigation */}
          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={() => navigateMonth(-1)} style={styles.navButton}>
              <Feather name="chevron-left" size={20} color={Colors.gold} />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {monthData.monthLabel} {monthData.year}
            </Text>
            <TouchableOpacity onPress={() => navigateMonth(1)} style={styles.navButton}>
              <Feather name="chevron-right" size={20} color={Colors.gold} />
            </TouchableOpacity>
          </View>

          {/* Weekday Headers */}
          <View style={styles.weekdayRow}>
            {WEEKDAY_LABELS.map((label) => (
              <View key={label} style={styles.weekdayCell}>
                <Text style={styles.weekdayText}>{label}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {monthData.days.map((day, index) => {
              if (!day) {
                return <View key={`empty-${index}`} style={styles.dayCell} />;
              }
              
              const key = toDateKey(day);
              const isToday = key === todayKey;
              const isSelected = key === selectedDateKey;
              const dayEvents = eventsByDate[key] || [];
              
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                    isToday && styles.dayCellToday,
                  ]}
                  onPress={() => setSelectedDateKey(key)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.dayCellText,
                    isSelected && styles.dayCellTextSelected,
                    isToday && styles.dayCellTextToday,
                  ]}>
                    {day.getDate()}
                  </Text>
                  
                  {/* Event Dots */}
                  {dayEvents.length > 0 && (
                    <View style={styles.eventDots}>
                      {dayEvents.slice(0, 3).map((_, i) => (
                        <View key={i} style={styles.eventDot} />
                      ))}
                      {dayEvents.length > 3 && (
                        <Text style={styles.moreEventsText}>+{dayEvents.length - 3}</Text>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </DashboardCard>

        <View style={styles.headerRow}>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.secondaryPill}
              onPress={goToToday}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryPillText}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={openCreateModal} activeOpacity={0.85}>
              <Feather name="plus" size={16} color={Colors.primary} />
              <Text style={styles.addButtonText}>New event</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Events for {formatSelectedDay(selectedDateKey)}</Text>

        {loading ? (
          <DashboardCard style={styles.eventCard}>
            <Text style={styles.emptyText}>Loading your events...</Text>
          </DashboardCard>
        ) : null}

        {error ? (
          <DashboardCard style={styles.eventCard}>
            <Text style={styles.errorText}>{error}</Text>
          </DashboardCard>
        ) : null}

        {!loading && selectedDayEvents.length === 0 ? (
          <DashboardCard style={styles.eventCard}>
            <Text style={styles.emptyTitle}>No events yet</Text>
            <Text style={styles.emptyText}>
              Tap New event to add something for {formatSelectedDay(selectedDateKey)}.
            </Text>
          </DashboardCard>
        ) : null}

        {selectedDayEvents.map((event, index) => (
          <DashboardCard key={event.id} style={styles.eventCard}>
            <View style={styles.eventRow}>
              <View style={styles.timeColumn}>
                <Text style={styles.eventTime}>{event.time}</Text>
                <View style={styles.timelineDot} />
                {index !== selectedDayEvents.length - 1 && <View style={styles.timelineLine} />}
              </View>

              <TouchableOpacity
                style={styles.eventBody}
                activeOpacity={0.85}
                onPress={() => openEditModal(event)}
              >
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventDetail}>{event.detail || 'No additional notes yet.'}</Text>
                <Text style={styles.eventMeta}>{formatEventDateTime(event.date, event.time)}</Text>
              </TouchableOpacity>

              <View style={styles.actionColumn}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => openEditModal(event)}
                  activeOpacity={0.8}
                >
                  <Feather name="edit-2" size={15} color={Colors.gold} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => confirmDeleteEvent(event)}
                  activeOpacity={0.8}
                >
                  <Feather name="trash-2" size={15} color={Colors.warning} />
                </TouchableOpacity>
              </View>
            </View>
          </DashboardCard>
        ))}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingEventId ? 'Edit event' : 'Create event'}
              </Text>
              <TouchableOpacity onPress={closeModal} activeOpacity={0.85}>
                <Feather name="x" size={20} color={Colors.gray} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                value={form.title}
                onChangeText={(title) => setForm((current) => ({ ...current, title }))}
                placeholder="Planning review"
                placeholderTextColor={Colors.gray}
                style={styles.input}
              />
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>Detail</Text>
              <TextInput
                value={form.detail}
                onChangeText={(detail) => setForm((current) => ({ ...current, detail }))}
                placeholder="Team sync and priorities"
                placeholderTextColor={Colors.gray}
                style={[styles.input, styles.textArea]}
                multiline
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputBlock, styles.flexOne]}>
                <Text style={styles.inputLabel}>Date</Text>
                <TextInput
                  value={form.date}
                  onChangeText={(date) => setForm((current) => ({ ...current, date }))}
                  placeholder="2026-04-24"
                  placeholderTextColor={Colors.gray}
                  style={styles.input}
                />
              </View>

              <View style={[styles.inputBlock, styles.timeField]}>
                <Text style={styles.inputLabel}>Time</Text>
                <TextInput
                  value={form.time}
                  onChangeText={(time) => setForm((current) => ({ ...current, time }))}
                  placeholder="09:00"
                  placeholderTextColor={Colors.gray}
                  style={styles.input}
                />
              </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.secondaryButton, saving && styles.disabledButton]}
                onPress={closeModal}
                activeOpacity={0.85}
                disabled={saving}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryButton, saving && styles.disabledButton]}
                onPress={handleSaveEvent}
                activeOpacity={0.85}
                disabled={saving}
              >
                <Text style={styles.primaryButtonText}>
                  {saving ? 'Saving...' : editingEventId ? 'Update' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  // Month Navigation
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  monthTitle: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  // Weekday Headers
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekdayText: {
    color: Colors.gold,
    fontSize: 12,
    fontWeight: '700',
  },
  // Calendar Grid
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 0.85,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 4,
  },
  dayCellSelected: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  dayCellToday: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  dayCellText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  dayCellTextSelected: {
    color: Colors.gold,
    fontWeight: '700',
  },
  dayCellTextToday: {
    color: Colors.gold,
    fontWeight: '600',
  },
  // Event Dots
  eventDots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 2,
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gold,
  },
  moreEventsText: {
    color: Colors.gray,
    fontSize: 8,
    marginLeft: 2,
  },
  // Header Row
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 24,
    marginBottom: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: Colors.gold,
  },
  addButtonText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  secondaryPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  secondaryPillText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
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
  eventMeta: {
    color: Colors.gold,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  actionColumn: {
    gap: 10,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  emptyTitle: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyText: {
    color: Colors.gray,
    fontSize: 13,
    lineHeight: 18,
  },
  errorText: {
    color: Colors.warning,
    fontSize: 13,
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 6, 12, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    borderRadius: 22,
    padding: 18,
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.18)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '800',
  },
  inputBlock: {
    marginBottom: 14,
  },
  inputLabel: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    color: Colors.white,
    fontSize: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 50,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  flexOne: {
    flex: 1,
  },
  timeField: {
    width: 104,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  secondaryButtonText: {
    color: Colors.gray,
    fontSize: 14,
    fontWeight: '700',
  },
  primaryButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gold,
  },
  primaryButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.7,
  },
});