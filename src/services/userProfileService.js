import { doc, getDoc, setDoc } from 'firebase/firestore';
import { updateEmail, updateProfile } from 'firebase/auth';

import { auth, db } from './firebaseService';

const USERS_COLLECTION = 'users';

export const emptyProfile = {
  fullname: '',
  nickname: '',
  dateOfBirth: '',
  phone: '',
  email: '',
};

function normalizeProfile(data = {}) {
  return {
    fullname: data.fullname ?? '',
    nickname: data.nickname ?? '',
    dateOfBirth: data.dateOfBirth ?? '',
    phone: data.phone ?? '',
    email: data.email ?? '',
  };
}

export async function getUserProfile(uid) {
  if (!uid) {
    return { ...emptyProfile };
  }

  const snapshot = await getDoc(doc(db, USERS_COLLECTION, uid));

  if (!snapshot.exists()) {
    return { ...emptyProfile };
  }

  return normalizeProfile(snapshot.data());
}

export async function saveUserProfile(uid, data, options = {}) {
  if (!uid) {
    throw new Error('Missing authenticated user.');
  }

  const userRef = doc(db, USERS_COLLECTION, uid);
  const normalized = normalizeProfile(data);
  const currentUser = auth.currentUser;

  if (currentUser && options.updateAuthEmail !== false && normalized.email && normalized.email !== currentUser.email) {
    await updateEmail(currentUser, normalized.email);
  }

  if (currentUser && normalized.fullname) {
    await updateProfile(currentUser, {
      displayName: normalized.fullname,
    });
  }

  await setDoc(
    userRef,
    {
      ...normalized,
      updatedAt: new Date().toISOString(),
      ...(options.createdAt ? { createdAt: options.createdAt } : {}),
    },
    { merge: true }
  );

  return normalized;
}
