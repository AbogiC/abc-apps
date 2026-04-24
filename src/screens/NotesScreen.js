import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import DashboardCard from '../components/DashboardCard';
import { Colors } from '../theme/colors';

const notes = [
  {
    title: 'Morning reset',
    body: 'Review the top three priorities, clear one small task, then start the day with momentum.',
    tag: 'Focus',
  },
  {
    title: 'Ideas for later',
    body: 'Capture the new dashboard widget idea and the calendar reminder flow while it is still fresh.',
    tag: 'Ideas',
  },
  {
    title: 'Shopping list',
    body: 'Keep it short: groceries, cable, notebook refill, and a new desk lamp.',
    tag: 'Personal',
  },
];

export default function NotesScreen() {
  const topInset = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
  const bottomInset = Platform.OS === 'android' ? 24 : 16;

  return (
    <SafeAreaView style={[styles.container, { paddingTop: topInset + 8, paddingBottom: bottomInset }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>Notes</Text>
        <Text style={styles.title}>Capture ideas fast</Text>
        <Text style={styles.subtitle}>A quick place for thoughts, tasks, and reminders you do not want to lose.</Text>

        <DashboardCard title="Quick Note">
          <View style={styles.quickNote}>
            <Feather name="edit-3" size={18} color={Colors.gold} />
            <View style={styles.quickNoteText}>
              <Text style={styles.quickNoteTitle}>Tap to start writing</Text>
              <Text style={styles.quickNoteBody}>Keep this area ready for short thoughts or meeting follow-ups.</Text>
            </View>
          </View>
        </DashboardCard>

        <Text style={styles.sectionTitle}>Pinned Notes</Text>
        {notes.map((note) => (
          <DashboardCard key={note.title} style={styles.noteCard}>
            <View style={styles.noteHeader}>
              <Text style={styles.noteTitle}>{note.title}</Text>
              <View style={styles.noteTag}>
                <Text style={styles.noteTagText}>{note.tag}</Text>
              </View>
            </View>
            <Text style={styles.noteBody}>{note.body}</Text>
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
  quickNote: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  quickNoteText: {
    flex: 1,
  },
  quickNoteTitle: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  quickNoteBody: {
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
  noteCard: {
    marginBottom: 14,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  noteTitle: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  noteTag: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  noteTagText: {
    color: Colors.gold,
    fontSize: 11,
    fontWeight: '700',
  },
  noteBody: {
    color: Colors.gray,
    fontSize: 13,
    lineHeight: 19,
  },
});
