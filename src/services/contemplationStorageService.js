import AsyncStorage from '@react-native-async-storage/async-storage';

const CONTEMPLATION_STORAGE_KEY = '@abc-apps/contemplations';

export const MOOD_OPTIONS = [
  'Calm',
  'Grateful',
  'Uncertain',
  'Inspired',
  'Heavy',
  'Hopeful',
];

function normalizeContemplation(item = {}) {
  return {
    id: item.id ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: item.title ?? '',
    mood: item.mood ?? MOOD_OPTIONS[0],
    contemplation: item.contemplation ?? '',
    createdAt: item.createdAt ?? new Date().toISOString(),
  };
}

export async function getContemplations() {
  const raw = await AsyncStorage.getItem(CONTEMPLATION_STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map(normalizeContemplation).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    return [];
  }
}

export async function addContemplation(entry) {
  const currentItems = await getContemplations();
  const nextEntry = normalizeContemplation(entry);
  const nextItems = [nextEntry, ...currentItems];

  await AsyncStorage.setItem(CONTEMPLATION_STORAGE_KEY, JSON.stringify(nextItems));
  return nextItems;
}

export async function clearContemplations() {
  await AsyncStorage.removeItem(CONTEMPLATION_STORAGE_KEY);
}
