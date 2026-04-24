import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';

import { db } from './firebaseService';

const CALENDAR_COLLECTION = 'calendarEvents';

function calendarCollectionRef(uid) {
  if (!uid) {
    throw new Error('Missing authenticated user.');
  }

  return collection(db, 'users', uid, CALENDAR_COLLECTION);
}

function toTimeString(value) {
  if (!value) {
    return '09:00';
  }

  if (typeof value === 'string') {
    return value.slice(0, 5);
  }

  if (value.toDate) {
    const date = value.toDate();
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  return '09:00';
}

function toDateObject(value, timeValue = '') {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-').map((segment) => Number(segment));
      const date = new Date(year, month - 1, day);

      if (timeValue && /^\d{2}:\d{2}$/.test(timeValue)) {
        const [hours, minutes] = timeValue.split(':').map((segment) => Number(segment));
        date.setHours(hours, minutes, 0, 0);
      }

      return date;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof value.toDate === 'function') {
    return value.toDate();
  }

  if (typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000 + Math.floor((value.nanoseconds ?? 0) / 1e6));
  }

  return null;
}

function toDateKey(value, timeValue = '') {
  const date = toDateObject(value, timeValue);
  if (!date) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function normalizeCalendarEvent(item = {}) {
  const startAt = toDateObject(item.startAt) ?? toDateObject(item.date, item.time);

  return {
    id: item.id ?? '',
    title: item.title ?? '',
    detail: item.detail ?? '',
    date: toDateKey(item.date ?? startAt, item.time),
    time: toTimeString(item.time),
    startAt,
    createdAt: item.createdAt ?? null,
    updatedAt: item.updatedAt ?? null,
    userId: item.userId ?? '',
  };
}

export function listenToCalendarEvents(uid, onChange, onError) {
  const eventsQuery = query(calendarCollectionRef(uid), orderBy('startAt', 'asc'));

  return onSnapshot(
    eventsQuery,
    (snapshot) => {
      const nextEvents = snapshot.docs.map((eventDoc) =>
        normalizeCalendarEvent({
          id: eventDoc.id,
          ...eventDoc.data(),
        })
      );

      onChange(nextEvents);
    },
    (error) => {
      if (onError) {
        onError(error);
      }
    }
  );
}

export async function createCalendarEvent(uid, event) {
  const startAt = toDateObject(event.startAt ?? event.date, event.time);

  const payload = {
    title: event.title.trim(),
    detail: event.detail.trim(),
    date: startAt,
    time: event.time,
    userId: uid,
    startAt,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(calendarCollectionRef(uid), payload);
  return ref.id;
}

export async function updateCalendarEvent(uid, eventId, event) {
  if (!eventId) {
    throw new Error('Missing calendar event id.');
  }

  const startAt = toDateObject(event.startAt ?? event.date, event.time);

  const payload = {
    title: event.title.trim(),
    detail: event.detail.trim(),
    date: startAt,
    time: event.time,
    userId: uid,
    startAt,
    updatedAt: serverTimestamp(),
  };

  await updateDoc(doc(db, 'users', uid, CALENDAR_COLLECTION, eventId), payload);
}

export async function removeCalendarEvent(uid, eventId) {
  if (!eventId) {
    throw new Error('Missing calendar event id.');
  }

  await deleteDoc(doc(db, 'users', uid, CALENDAR_COLLECTION, eventId));
}
