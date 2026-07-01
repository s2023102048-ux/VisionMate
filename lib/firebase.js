// ============================================================
// lib/firebase.js — Firebase configuration & helper functions
// Using modular Firebase v10 SDK (tree-shakeable, no compat)
// ============================================================

import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';

const FIREBASE_CONFIG = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Avoid re-initializing on hot reload in dev
let app, db, storage;
try {
  app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApps()[0];
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

// ============================================================
// FIRESTORE HELPERS
// ============================================================

/**
 * Save a new accessibility report to Firestore.
 * @param {Object} report - { lat, lng, photoUrl, status, description, note }
 * @returns {Promise<string>} - Document ID
 */
export async function saveReport(report) {
  const docRef = await addDoc(collection(db, 'reports'), {
    lat:         report.lat,
    lng:         report.lng,
    photoUrl:    report.photoUrl,
    status:      report.status,       // "ACCESSIBLE" | "HAZARD"
    description: report.description,
    note:        report.note || '',
    timestamp:   serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Listen for all reports in real-time.
 * @param {Function} callback - Called with array of report objects on every update
 * @returns {Function} - Unsubscribe function
 */
export function listenToReports(callback) {
  const q = query(collection(db, 'reports'), orderBy('timestamp', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const reports = [];
      snapshot.forEach((doc) => {
        reports.push({ id: doc.id, ...doc.data() });
      });
      callback(reports);
    },
    (err) => {
      console.error('Firestore listener error:', err);
    }
  );
}

// ============================================================
// STORAGE HELPERS
// ============================================================

/**
 * Upload an image file to Firebase Storage.
 * @param {File} file - The image file to upload
 * @param {Function} onProgress - Optional progress callback (0-100)
 * @returns {Promise<string>} - Public download URL
 */
export function uploadPhoto(file, onProgress) {
  const ext      = file.name.split('.').pop() || 'jpg';
  const filename = `reports/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const storageRef = ref(storage, filename);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (onProgress) {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress(pct);
        }
      },
      (err) => reject(err),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });
}
