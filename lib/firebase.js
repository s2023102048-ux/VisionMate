// ============================================================
// lib/firebase.js — Firebase configuration & helper functions
// ALL firebase SDK imports are LAZY (inside async functions).
// This prevents Turbopack from bundling firebase into the SSR
// chunk, which causes a TDZ crash on Cloudflare Pages.
// ============================================================

const FIREBASE_CONFIG = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Lazy singletons — initialized once on first call
let _app  = null;
let _db   = null;

async function _getApp() {
  if (_app) return _app;
  const { initializeApp, getApps } = await import('firebase/app');
  _app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
  return _app;
}

async function _getDb() {
  if (_db) return _db;
  const app = await _getApp();
  const { getFirestore } = await import('firebase/firestore');
  _db = getFirestore(app);
  return _db;
}

// Export app for AuthModal (also lazily initialized)
export async function getFirebaseApp() {
  return _getApp();
}

// ============================================================
// FIRESTORE HELPERS
// ============================================================

/**
 * Save a new accessibility report to Firestore.
 */
export async function saveReport(report) {
  const db = await _getDb();
  const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
  const docRef = await addDoc(collection(db, 'reports'), {
    lat:         report.lat,
    lng:         report.lng,
    photoUrl:    report.photoUrl,
    status:      report.status,
    severity:    report.severity   || '',
    rating:      report.rating     ?? null,
    category:    report.category   || '',
    description: report.description,
    note:        report.note       || '',
    timestamp:   serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Listen for all reports in real-time.
 * Returns an unsubscribe function immediately (safe for useEffect cleanup).
 */
export function listenToReports(callback) {
  // We return a teardown immediately; the real unsub is swapped in once
  // the async initialization completes.
  let unsub = () => {};
  (async () => {
    try {
      const db = await _getDb();
      const { collection, query, orderBy, onSnapshot } = await import('firebase/firestore');
      const q = query(collection(db, 'reports'), orderBy('timestamp', 'desc'));
      unsub = onSnapshot(
        q,
        (snapshot) => {
          const reports = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          callback(reports);
        },
        (err) => console.error('Firestore listener error:', err)
      );
    } catch (err) {
      console.error('listenToReports init failed:', err);
    }
  })();
  return () => unsub();
}

/**
 * Delete a single report by document ID.
 */
export async function deleteReport(reportId) {
  const db = await _getDb();
  const { doc, deleteDoc } = await import('firebase/firestore');
  await deleteDoc(doc(db, 'reports', reportId));
}

/**
 * Delete ALL reports (testing only).
 */
export async function deleteAllReports() {
  const db = await _getDb();
  const { collection, getDocs, writeBatch, doc } = await import('firebase/firestore');
  const snapshot = await getDocs(collection(db, 'reports'));
  const batch = writeBatch(db);
  snapshot.forEach((d) => batch.delete(doc(db, 'reports', d.id)));
  await batch.commit();
}

// ============================================================
// STORAGE HELPERS
// ============================================================

/**
 * Upload a photo via the server-side /api/upload route.
 */
export async function uploadPhoto(file, onProgress) {
  if (onProgress) onProgress(10);

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (onProgress) onProgress(90);

  const result = await response.json();

  if (!response.ok || result.error) {
    throw new Error(result.error || 'Upload failed');
  }

  if (onProgress) onProgress(100);
  return result.url;
}
