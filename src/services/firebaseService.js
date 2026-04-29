import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const requiredConfig = {
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
};

const missingFirebaseConfigKeys = Object.entries(requiredConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

const firebaseConfigError =
  missingFirebaseConfigKeys.length > 0
    ? `Missing Firebase environment variables: ${missingFirebaseConfigKeys.join(', ')}`
    : '';

const app = firebaseConfigError
  ? null
  : getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig);

const db = app ? getFirestore(app) : null;

let auth = null;

if (app) {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  } catch {
    auth = getAuth(app);
  }
}

function getFirestoreInstance() {
  if (!db) {
    throw new Error(firebaseConfigError || 'Firebase Firestore is not initialized.');
  }

  return db;
}

export {
  app,
  auth,
  db,
  firebaseConfig,
  firebaseConfigError,
  getFirestoreInstance,
  missingFirebaseConfigKeys,
};
