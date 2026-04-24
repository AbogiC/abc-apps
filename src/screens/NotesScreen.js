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
import {
  createTask,
  getTasks,
  removeTask,
  TASK_PRIORITIES,
  toggleTaskCompleted,
  updateTask,
} from '../services/notesTaskStorageService';

const emptyForm = {
  title: '',
  detail: '',
  deadline: '',
  priority: 'Medium',
};

function isValidDateInput(value) {
  if (!value) {
    return false;
  }

  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}

function formatDeadline(value) {
  if (!value) {
    return 'No deadline';
  }

  if (!isValidDateInput(value)) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function getPriorityColor(priority) {
  if (priority === 'High') {
    return Colors.warning;
  }

  if (priority === 'Low') {
    return Colors.success;
  }

  return Colors.gold;
}

function sortTasks(items) {
  const priorityOrder = { High: 0, Medium: 1, Low: 2 };

  return [...items].sort((a, b) => {
    if (a.completed !== b.completed) {
      return Number(a.completed) - Number(b.completed);
    }

    const deadlineA = a.deadline && isValidDateInput(a.deadline) ? new Date(a.deadline).getTime() : Number.POSITIVE_INFINITY;
    const deadlineB = b.deadline && isValidDateInput(b.deadline) ? new Date(b.deadline).getTime() : Number.POSITIVE_INFINITY;

    if (deadlineA !== deadlineB) {
      return deadlineA - deadlineB;
    }

    const priorityDiff = (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1);
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export default function NotesScreen() {
  const topInset = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
  const bottomInset = Platform.OS === 'android' ? 24 : 16;

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const sortedTasks = useMemo(() => sortTasks(tasks), [tasks]);
  const activeTasks = useMemo(() => sortedTasks.filter((task) => !task.completed), [sortedTasks]);
  const completedTasks = useMemo(() => sortedTasks.filter((task) => task.completed), [sortedTasks]);
  const taskCountText = useMemo(() => {
    const openCount = activeTasks.length;
    const completedCount = completedTasks.length;
    return `${openCount} open, ${completedCount} done`;
  }, [activeTasks.length, completedTasks.length]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const nextTasks = await getTasks();
      setTasks(nextTasks);
    } catch (loadError) {
      setError(loadError?.message ?? 'Could not load tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const openCreateModal = () => {
    setEditingTaskId(null);
    setForm(emptyForm);
    setError('');
    setModalVisible(true);
  };

  const openEditModal = (task) => {
    setEditingTaskId(task.id);
    setForm({
      title: task.title ?? '',
      detail: task.detail ?? '',
      deadline: task.deadline ?? '',
      priority: task.priority ?? 'Medium',
    });
    setError('');
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSaving(false);
    setError('');
  };

  const handleSaveTask = async () => {
    if (!form.title.trim()) {
      setError('Please add a task title.');
      return;
    }

    if (form.deadline && !isValidDateInput(form.deadline)) {
      setError('Please use a valid deadline like 2026-04-24.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const payload = {
        title: form.title.trim(),
        detail: form.detail.trim(),
        deadline: form.deadline.trim(),
        priority: TASK_PRIORITIES.includes(form.priority) ? form.priority : 'Medium',
      };

      if (editingTaskId) {
        await updateTask(editingTaskId, payload);
      } else {
        await createTask(payload);
      }

      await loadTasks();
      closeModal();
    } catch (saveError) {
      setError(saveError?.message ?? 'Could not save the task.');
      setSaving(false);
    }
  };

  const handleToggleCompleted = async (taskId) => {
    try {
      const nextTasks = await toggleTaskCompleted(taskId);
      setTasks(nextTasks);
    } catch (toggleError) {
      setError(toggleError?.message ?? 'Could not update the task.');
    }
  };

  const confirmDeleteTask = (task) => {
    Alert.alert('Delete task?', task.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const nextTasks = await removeTask(task.id);
            setTasks(nextTasks);
          } catch (deleteError) {
            setError(deleteError?.message ?? 'Could not delete the task.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: topInset + 8, paddingBottom: bottomInset }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>Notes</Text>
        <Text style={styles.title}>Capture tasks fast</Text>
        <Text style={styles.subtitle}>
          A quick place for tasks, deadlines, and priorities you do not want to lose.
        </Text>

        <DashboardCard style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroIcon}>
              <Feather name="check-square" size={18} color={Colors.gold} />
            </View>
            <View style={styles.heroBody}>
              <Text style={styles.heroTitle}>Task inbox</Text>
              <Text style={styles.heroText}>{taskCountText}</Text>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={openCreateModal} activeOpacity={0.85}>
              <Feather name="plus" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.heroCta} onPress={openCreateModal} activeOpacity={0.85}>
            <Text style={styles.heroCtaText}>Add a new task</Text>
          </TouchableOpacity>
        </DashboardCard>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tasks</Text>
          <Text style={styles.sectionSubtitle}>Sorted by status, deadline, and priority</Text>
        </View>

        {loading ? (
          <DashboardCard style={styles.noteCard}>
            <Text style={styles.emptyText}>Loading tasks...</Text>
          </DashboardCard>
        ) : null}

        {error ? (
          <DashboardCard style={styles.noteCard}>
            <Text style={styles.errorText}>{error}</Text>
          </DashboardCard>
        ) : null}

        {!loading && sortedTasks.length === 0 ? (
          <DashboardCard style={styles.noteCard}>
            <Text style={styles.emptyTitle}>No tasks yet</Text>
            <Text style={styles.emptyText}>
              Tap Add a new task to save one directly on this phone.
            </Text>
          </DashboardCard>
        ) : null}

        {sortedTasks.map((task) => {
          const priorityColor = getPriorityColor(task.priority);
          return (
            <DashboardCard key={task.id} style={styles.noteCard}>
              <View style={styles.taskRow}>
                <TouchableOpacity
                  style={[
                    styles.checkbox,
                    task.completed && styles.checkboxActive,
                  ]}
                  onPress={() => handleToggleCompleted(task.id)}
                  activeOpacity={0.85}
                >
                  {task.completed ? <Feather name="check" size={14} color={Colors.primary} /> : null}
                </TouchableOpacity>

                <TouchableOpacity style={styles.taskBody} activeOpacity={0.85} onPress={() => openEditModal(task)}>
                  <View style={styles.noteHeader}>
                    <Text style={[styles.noteTitle, task.completed && styles.noteTitleDone]}>
                      {task.title}
                    </Text>
                    <View style={[styles.noteTag, { backgroundColor: `${priorityColor}20` }]}>
                      <Text style={[styles.noteTagText, { color: priorityColor }]}>
                        {task.priority}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.noteBody}>{task.detail || 'No description yet.'}</Text>
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Feather name="calendar" size={12} color={Colors.gray} />
                      <Text style={styles.metaText}>{formatDeadline(task.deadline)}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Feather name={task.completed ? 'check-circle' : 'clock'} size={12} color={Colors.gray} />
                      <Text style={styles.metaText}>{task.completed ? 'Completed' : 'Open'}</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                <View style={styles.actionsColumn}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openEditModal(task)}
                    activeOpacity={0.8}
                  >
                    <Feather name="edit-2" size={15} color={Colors.gold} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => confirmDeleteTask(task)}
                    activeOpacity={0.8}
                  >
                    <Feather name="trash-2" size={15} color={Colors.warning} />
                  </TouchableOpacity>
                </View>
              </View>
            </DashboardCard>
          );
        })}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingTaskId ? 'Edit task' : 'Create task'}</Text>
              <TouchableOpacity onPress={closeModal} activeOpacity={0.85}>
                <Feather name="x" size={20} color={Colors.gray} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>Task title</Text>
              <TextInput
                value={form.title}
                onChangeText={(title) => setForm((current) => ({ ...current, title }))}
                placeholder="Finish weekly review"
                placeholderTextColor={Colors.gray}
                style={styles.input}
              />
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>Details</Text>
              <TextInput
                value={form.detail}
                onChangeText={(detail) => setForm((current) => ({ ...current, detail }))}
                placeholder="Add notes, context, or sub-steps"
                placeholderTextColor={Colors.gray}
                style={[styles.input, styles.textArea]}
                multiline
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputBlock, styles.flexOne]}>
                <Text style={styles.inputLabel}>Deadline</Text>
                <TextInput
                  value={form.deadline}
                  onChangeText={(deadline) => setForm((current) => ({ ...current, deadline }))}
                  placeholder="2026-04-24"
                  placeholderTextColor={Colors.gray}
                  style={styles.input}
                />
              </View>

              <View style={[styles.inputBlock, styles.priorityField]}>
                <Text style={styles.inputLabel}>Priority</Text>
                <View style={styles.priorityPills}>
                  {TASK_PRIORITIES.map((priority) => {
                    const active = form.priority === priority;
                    return (
                      <TouchableOpacity
                        key={priority}
                        style={[styles.priorityPill, active && styles.priorityPillActive]}
                        onPress={() => setForm((current) => ({ ...current, priority }))}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.priorityPillText, active && styles.priorityPillTextActive]}>
                          {priority}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
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
                onPress={handleSaveTask}
                activeOpacity={0.85}
                disabled={saving}
              >
                <Text style={styles.primaryButtonText}>
                  {saving ? 'Saving...' : editingTaskId ? 'Update' : 'Save'}
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
  heroCard: {
    marginBottom: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
  },
  heroBody: {
    flex: 1,
  },
  heroTitle: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  heroText: {
    color: Colors.gray,
    fontSize: 13,
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gold,
  },
  heroCta: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  heroCtaText: {
    color: Colors.gold,
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: Colors.gray,
    fontSize: 13,
  },
  noteCard: {
    marginBottom: 14,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  taskBody: {
    flex: 1,
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
  noteTitleDone: {
    textDecorationLine: 'line-through',
    color: Colors.gray,
  },
  noteTag: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  noteTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  noteBody: {
    color: Colors.gray,
    fontSize: 13,
    lineHeight: 19,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  metaText: {
    color: Colors.gray,
    fontSize: 12,
    fontWeight: '600',
  },
  actionsColumn: {
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
  priorityField: {
    width: 132,
  },
  priorityPills: {
    gap: 8,
  },
  priorityPill: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  priorityPillActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderColor: 'rgba(212, 175, 55, 0.24)',
  },
  priorityPillText: {
    color: Colors.gray,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  priorityPillTextActive: {
    color: Colors.gold,
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
