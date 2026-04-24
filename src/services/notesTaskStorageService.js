import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTES_TASKS_STORAGE_KEY = '@abc-apps/tasks';

export const TASK_PRIORITIES = ['Low', 'Medium', 'High'];

function normalizeTask(item = {}) {
  return {
    id: item.id ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: item.title ?? '',
    detail: item.detail ?? '',
    deadline: item.deadline ?? '',
    priority: TASK_PRIORITIES.includes(item.priority) ? item.priority : TASK_PRIORITIES[1],
    completed: Boolean(item.completed),
    createdAt: item.createdAt ?? new Date().toISOString(),
    updatedAt: item.updatedAt ?? new Date().toISOString(),
  };
}

async function readTasks() {
  const raw = await AsyncStorage.getItem(NOTES_TASKS_STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map(normalizeTask).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } catch {
    return [];
  }
}

async function writeTasks(tasks) {
  await AsyncStorage.setItem(NOTES_TASKS_STORAGE_KEY, JSON.stringify(tasks));
}

export async function getTasks() {
  return readTasks();
}

export async function createTask(task) {
  const currentTasks = await readTasks();
  const nextTask = normalizeTask(task);
  const nextTasks = [nextTask, ...currentTasks];

  await writeTasks(nextTasks);
  return nextTasks;
}

export async function updateTask(taskId, task) {
  const currentTasks = await readTasks();
  const nextTasks = currentTasks.map((item) =>
    item.id === taskId
      ? normalizeTask({
          ...item,
          ...task,
          id: item.id,
          createdAt: item.createdAt,
          updatedAt: new Date().toISOString(),
        })
      : item
  );

  await writeTasks(nextTasks);
  return nextTasks;
}

export async function removeTask(taskId) {
  const currentTasks = await readTasks();
  const nextTasks = currentTasks.filter((item) => item.id !== taskId);

  await writeTasks(nextTasks);
  return nextTasks;
}

export async function toggleTaskCompleted(taskId) {
  const currentTasks = await readTasks();
  const nextTasks = currentTasks.map((item) =>
    item.id === taskId
      ? {
          ...item,
          completed: !item.completed,
          updatedAt: new Date().toISOString(),
        }
      : item
  );

  await writeTasks(nextTasks);
  return nextTasks;
}
