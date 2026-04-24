import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import DashboardCard from '../components/DashboardCard';
import { Colors } from '../theme/colors';
import {
  addContemplation,
  getContemplations,
  MOOD_OPTIONS,
  clearContemplations,
} from '../services/contemplationStorageService';

const prompts = [
  'What is one thing I can release today?',
  'What deserves my attention most right now?',
  'What would make this evening feel peaceful?',
];

function formatCreatedAt(createdAt) {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return 'Just now';
  }

  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function ContemplationScreen() {
  const topInset = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
  const bottomInset = Platform.OS === 'android' ? 24 : 16;

  const [title, setTitle] = useState('');
  const [mood, setMood] = useState(MOOD_OPTIONS[0]);
  const [contemplation, setContemplation] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadItems = async () => {
      try {
        setLoading(true);
        const savedItems = await getContemplations();
        setItems(savedItems);
      } catch {
        setError('Could not load saved contemplations.');
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, []);

  const resetForm = () => {
    setTitle('');
    setMood(MOOD_OPTIONS[0]);
    setContemplation('');
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Please add a title for your contemplation.');
      return;
    }

    if (!contemplation.trim()) {
      setError('Please write your contemplation before saving.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const nextItems = await addContemplation({
        title: title.trim(),
        mood,
        contemplation: contemplation.trim(),
      });

      setItems(nextItems);
      resetForm();
      Alert.alert('Saved', 'Your contemplation was stored on this phone.');
    } catch {
      setError('Could not save your contemplation right now.');
    } finally {
      setSaving(false);
    }
  };

  const handleClearAll = async () => {
    try {
      setClearing(true);
      await clearContemplations();
      setItems([]);
    } catch {
      setError('Could not clear saved contemplations.');
    } finally {
      setClearing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: topInset + 8, paddingBottom: bottomInset }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Text style={styles.kicker}>Contemplation</Text>
          <Text style={styles.title}>Slow the pace</Text>
          <Text style={styles.subtitle}>
            Capture a thought, choose a mood, and keep a personal reflection saved on this phone.
          </Text>

          <DashboardCard title="Breathing Reset">
            <View style={styles.breathingRow}>
              <View style={styles.breathingCircle}>
                <Feather name="wind" size={22} color={Colors.gold} />
              </View>
              <View style={styles.breathingText}>
                <Text style={styles.breathingTitle}>4 in, 4 hold, 6 out</Text>
                <Text style={styles.breathingBody}>
                  Use this when the day feels noisy and you need a fast reset.
                </Text>
              </View>
            </View>
          </DashboardCard>

          <Text style={styles.sectionTitle}>Create Contemplation</Text>
          <DashboardCard style={styles.formCard}>
            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>Title</Text>
              <View style={styles.inputWrap}>
                <View style={styles.inputIconWrap}>
                  <Feather name="edit-3" size={16} color={Colors.gray} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Evening reflection"
                  placeholderTextColor={Colors.gray}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>Mood</Text>
              <View style={styles.moodGrid}>
                {MOOD_OPTIONS.map((option) => {
                  const active = option === mood;
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[styles.moodChip, active && styles.moodChipActive]}
                      onPress={() => setMood(option)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.moodChipText, active && styles.moodChipTextActive]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.helperText}>
                Mood examples: calm, grateful, uncertain, inspired, heavy, hopeful.
              </Text>
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>Contemplation</Text>
              <View style={[styles.inputWrap, styles.textAreaWrap]}>
                <View style={[styles.inputIconWrap, styles.textAreaIconWrap]}>
                  <Feather name="pen-tool" size={16} color={Colors.gray} />
                </View>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Write your reflection here..."
                  placeholderTextColor={Colors.gray}
                  value={contemplation}
                  onChangeText={setContemplation}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color={Colors.primary} />
              ) : (
                <Text style={styles.saveButtonText}>Save Contemplation</Text>
              )}
            </TouchableOpacity>
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

          <View style={styles.previewHeaderRow}>
            <Text style={styles.sectionTitle}>Preview</Text>
            {items.length > 0 ? (
              <TouchableOpacity
                style={[styles.clearButton, clearing && styles.clearButtonDisabled]}
                onPress={handleClearAll}
                disabled={clearing}
                activeOpacity={0.85}
              >
                {clearing ? (
                  <ActivityIndicator color={Colors.gray} size="small" />
                ) : (
                  <Text style={styles.clearButtonText}>Clear all</Text>
                )}
              </TouchableOpacity>
            ) : null}
          </View>

          {loading ? (
            <DashboardCard style={styles.previewEmptyCard}>
              <ActivityIndicator color={Colors.gold} />
              <Text style={styles.previewEmptyText}>Loading saved contemplations...</Text>
            </DashboardCard>
          ) : items.length === 0 ? (
            <DashboardCard style={styles.previewEmptyCard}>
              <Feather name="book-open" size={22} color={Colors.gold} />
              <Text style={styles.previewEmptyTitle}>No saved contemplations yet</Text>
              <Text style={styles.previewEmptyText}>
                Create one above and it will appear here with its saved date and time.
              </Text>
            </DashboardCard>
          ) : (
            items.map((item) => (
              <DashboardCard key={item.id} style={styles.previewCard}>
                <View style={styles.previewTopRow}>
                  <View style={styles.previewMood}>
                    <Text style={styles.previewMoodText}>{item.mood}</Text>
                  </View>
                  <Text style={styles.previewDate}>{formatCreatedAt(item.createdAt)}</Text>
                </View>
                <Text style={styles.previewTitle}>{item.title}</Text>
                <Text style={styles.previewBody}>{item.contemplation}</Text>
              </DashboardCard>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboard: {
    flex: 1,
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
  formCard: {
    marginBottom: 14,
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
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 52,
  },
  textAreaWrap: {
    minHeight: 120,
  },
  inputIconWrap: {
    width: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textAreaIconWrap: {
    marginTop: 0,
  },
  input: {
    flex: 1,
    color: Colors.white,
    fontSize: 14,
  },
  textArea: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  moodChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  moodChipActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.14)',
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  moodChipText: {
    color: Colors.gray,
    fontSize: 12,
    fontWeight: '700',
  },
  moodChipTextActive: {
    color: Colors.gold,
  },
  helperText: {
    color: Colors.gray,
    fontSize: 11,
    marginTop: 8,
    lineHeight: 16,
  },
  errorText: {
    color: Colors.warning,
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  saveButton: {
    backgroundColor: Colors.gold,
    borderRadius: 16,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.75,
  },
  saveButtonText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '800',
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
  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  clearButton: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  clearButtonDisabled: {
    opacity: 0.7,
  },
  clearButtonText: {
    color: Colors.gray,
    fontSize: 12,
    fontWeight: '600',
  },
  previewEmptyCard: {
    alignItems: 'center',
  },
  previewEmptyTitle: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 6,
  },
  previewEmptyText: {
    color: Colors.gray,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  previewCard: {
    marginBottom: 14,
  },
  previewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  previewMood: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  previewMoodText: {
    color: Colors.gold,
    fontSize: 11,
    fontWeight: '700',
  },
  previewDate: {
    color: Colors.gray,
    fontSize: 11,
    fontWeight: '600',
  },
  previewTitle: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  previewBody: {
    color: Colors.gray,
    fontSize: 13,
    lineHeight: 19,
  },
});
