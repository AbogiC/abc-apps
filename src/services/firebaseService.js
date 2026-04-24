import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBxTh99omXU796CwiYpMT9Npi7uwcbEfeE",
  authDomain: "abc-apps23.firebaseapp.com",
  projectId: "abc-apps23",
  storageBucket: "abc-apps23.firebasestorage.app",
  messagingSenderId: "206172280477",
  appId: "1:206172280477:web:c8224fc6ede12c3659e674",
  measurementId: "G-VQJB5S2XTF"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

function getFirestoreInstance() {
  return db;
}

export { app, auth, db, getFirestoreInstance };
