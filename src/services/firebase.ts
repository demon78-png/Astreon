import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
  collection,
  query,
  where,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, WatchlistItem, FavoriteItem, UserReview } from '../types/entertainment';

// Initialize Firebase App singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Initialize Firestore with the provisioned database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write'
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous
    },
    operationType,
    path
  };
  console.warn('[ASTREON Firebase Notice]:', JSON.stringify(errInfo));
}

// Test connectivity to Firestore on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[ASTREON] Firestore client offline state detected');
    }
    return false;
  }
}

// ======================== AUTHENTICATION HELPERS ========================

export async function loginWithGoogle(): Promise<UserProfile | null> {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    if (!cred.user) return null;
    const profile: UserProfile = {
      uid: cred.user.uid,
      displayName: cred.user.displayName || cred.user.email?.split('@')[0] || 'Cinema Admirer',
      email: cred.user.email || '',
      avatar: cred.user.photoURL || undefined,
      preferredGenres: ['Science Fiction', 'Drama'],
      notificationPreferences: {
        emailAlerts: true,
        newReleases: true,
        curatedWeekly: false
      },
      createdAt: new Date().toISOString(),
      isAdmin: cred.user.email === 'danny2010qwert@gmail.com'
    };
    await saveUserProfile(profile);
    return profile;
  } catch (err) {
    console.warn('[ASTREON] Google sign-in cancelled or failed:', err);
    throw err;
  }
}

export async function registerWithEmailPassword(
  email: string,
  pass: string,
  displayName: string
): Promise<UserProfile> {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  const profile: UserProfile = {
    uid: cred.user.uid,
    displayName: displayName || email.split('@')[0],
    email: cred.user.email || email,
    preferredGenres: ['Science Fiction', 'Drama'],
    notificationPreferences: {
      emailAlerts: true,
      newReleases: true,
      curatedWeekly: false
    },
    createdAt: new Date().toISOString(),
    isAdmin: email.toLowerCase() === 'danny2010qwert@gmail.com'
  };
  await saveUserProfile(profile);
  return profile;
}

export async function loginWithEmailPassword(email: string, pass: string): Promise<UserProfile | null> {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  const saved = await getUserProfile(cred.user.uid);
  if (saved) return saved;
  return {
    uid: cred.user.uid,
    displayName: cred.user.displayName || email.split('@')[0],
    email: cred.user.email || email,
    preferredGenres: ['Science Fiction', 'Drama'],
    notificationPreferences: {
      emailAlerts: true,
      newReleases: true,
      curatedWeekly: false
    },
    createdAt: new Date().toISOString(),
    isAdmin: email.toLowerCase() === 'danny2010qwert@gmail.com'
  };
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function logoutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

export function subscribeToAuthState(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// ======================== USER PROFILE FIRESTORE ========================

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const path = `users/${profile.uid}`;
  try {
    await setDoc(doc(db, 'users', profile.uid), {
      ...profile,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
  return null;
}

// ======================== WATCHLIST FIRESTORE ========================

export async function fetchUserWatchlist(userId: string): Promise<WatchlistItem[]> {
  const path = `users/${userId}/watchlist`;
  try {
    const colRef = collection(db, 'users', userId, 'watchlist');
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map((d) => d.data() as WatchlistItem);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

export async function addToUserWatchlist(userId: string, entry: WatchlistItem): Promise<void> {
  const path = `users/${userId}/watchlist/${entry.mediaId}`;
  try {
    await setDoc(doc(db, 'users', userId, 'watchlist', String(entry.mediaId)), entry);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function removeFromUserWatchlist(userId: string, mediaId: number): Promise<void> {
  const path = `users/${userId}/watchlist/${mediaId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'watchlist', String(mediaId)));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// ======================== FAVOURITES FIRESTORE ========================

export async function fetchUserFavorites(userId: string): Promise<FavoriteItem[]> {
  const path = `users/${userId}/favorites`;
  try {
    const colRef = collection(db, 'users', userId, 'favorites');
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map((d) => d.data() as FavoriteItem);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

export async function addToUserFavorites(userId: string, entry: FavoriteItem): Promise<void> {
  const path = `users/${userId}/favorites/${entry.mediaId}`;
  try {
    await setDoc(doc(db, 'users', userId, 'favorites', String(entry.mediaId)), entry);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function removeFromUserFavorites(userId: string, mediaId: number): Promise<void> {
  const path = `users/${userId}/favorites/${mediaId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'favorites', String(mediaId)));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// ======================== REVIEWS FIRESTORE ========================

export async function publishFirestoreReview(review: UserReview): Promise<void> {
  const path = `reviews/${review.id}`;
  try {
    await setDoc(doc(db, 'reviews', review.id), review);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function fetchFirestoreReviews(mediaId?: number): Promise<UserReview[]> {
  const path = 'reviews';
  try {
    const colRef = collection(db, 'reviews');
    const q = mediaId
      ? query(colRef, where('mediaId', '==', mediaId))
      : colRef;
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data() as UserReview);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

// ======================== SEARCH HISTORY FIRESTORE ========================

export async function saveSearchQueryToFirestore(userId: string, queryText: string): Promise<void> {
  if (!queryText.trim()) return;
  const entryId = String(Date.now());
  const path = `users/${userId}/searchHistory/${entryId}`;
  try {
    await setDoc(doc(db, 'users', userId, 'searchHistory', entryId), {
      query: queryText.trim(),
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function fetchSearchHistoryFromFirestore(userId: string): Promise<string[]> {
  const path = `users/${userId}/searchHistory`;
  try {
    const colRef = collection(db, 'users', userId, 'searchHistory');
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data().query as string);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

// ======================== SITE SETTINGS & HERO CURATION ========================

export async function fetchSiteSettingsFromFirestore(): Promise<{ featuredMediaId?: number; announcement?: string } | null> {
  const path = 'siteSettings/general';
  try {
    const snap = await getDoc(doc(db, 'siteSettings', 'general'));
    if (snap.exists()) {
      return snap.data() as { featuredMediaId?: number; announcement?: string };
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
  return null;
}

export async function updateSiteSettingsInFirestore(featuredMediaId: number, announcement?: string): Promise<void> {
  const path = 'siteSettings/general';
  try {
    await setDoc(doc(db, 'siteSettings', 'general'), {
      featuredMediaId,
      announcement: announcement || '',
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// ======================== REPORTS & AUDIT LOGS ========================

export async function submitContentReportToFirestore(
  reporterId: string,
  targetType: 'review' | 'article' | 'user',
  targetId: string,
  reason: string
): Promise<void> {
  const reportId = `rep_${Date.now()}`;
  const path = `reports/${reportId}`;
  try {
    await setDoc(doc(db, 'reports', reportId), {
      id: reportId,
      reporterId,
      targetType,
      targetId,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// ======================== ACCOUNT DELETION ========================

export async function deleteUserAccountFromFirebase(userId: string): Promise<void> {
  const path = `users/${userId}`;
  try {
    await deleteDoc(doc(db, 'users', userId));
    if (auth.currentUser && auth.currentUser.uid === userId) {
      await auth.currentUser.delete();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    throw err;
  }
}

