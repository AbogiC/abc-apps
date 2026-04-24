import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';

import { db } from './firebaseService';

const CALENDAR_COLLECTION = 'calendarEvents';

function calendarCollectionRef(uid) {
  if (!uid) {
    throw new Error('Missing authenticated user.');
  }

  return collection(db, 'users', uid, CALENDAR_COLLECTION);
}

function toIsoDate(value) {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value.slice(0, 10);
  }

  if (value.toDate) {
    return value.toDate().toISOString().slice(0, 10);
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
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

export function normalizeCalendarEvent(item = {}) {
  return {
    id: item.id ?? '',
    title: item.title ?? '',
    detail: item.detail ?? '',
    date: toIsoDate(item.date),
    time: toTimeString(item.time),
    startAt: item.startAt ?? null,
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
  const payload = {
    title: event.title.trim(),
    detail: event.detail.trim(),
    date: event.date,
    time: event.time,
    userId: uid,
    startAt: event.startAt ?? null,
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

  const payload = {
    title: event.title.trim(),
    detail: event.detail.trim(),
    date: event.date,
    time: event.time,
    userId: uid,
    startAt: event.startAt ?? null,
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
