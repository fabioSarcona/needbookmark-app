import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export let db: any;
export let auth: any;
export const googleProvider = new GoogleAuthProvider();

let app: any;

export const initFirebase = async () => {
  if (app) return;
  try {
    let config;
    if (import.meta.env.VITE_FIREBASE_API_KEY) {
      // Vercel deployment: use environment variables
      config = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
        firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID
      };
    } else {
      // AI Studio local dev: fetch from backend
      const res = await fetch('/api/firebase-config');
      config = await res.json();
    }
    app = initializeApp(config);
    db = getFirestore(app, config.firestoreDatabaseId);
    auth = getAuth(app);
  } catch (error) {
    console.error("Failed to initialize Firebase", error);
  }
};

export const loginWithGoogle = async () => {
  if (!auth) return;
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error("Error signing in with Google", error);
  }
};

export const logout = async () => {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
  }
};
