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
  updateDoc,
  getDoc,
  getDocFromServer,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  runTransaction,
  limit
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  UserProfile,
  WatchlistItem,
  FavoriteItem,
  WatchHistoryItem,
  CustomCollection,
  UserReview,
  NewsArticle,
  AdminAuditLog
} from '../types/entertainment';
import { sanitizeWatchHistoryItem } from '../utils/watchHistory';
import { sanitizeCustomCollection } from '../utils/collections';
import { buildStarReviewDocument, clampStarRating } from '../utils/ratings';

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
    const existing = await getUserProfile(cred.user.uid);
    const profile: UserProfile = {
      uid: cred.user.uid,
      displayName:
        existing?.displayName ||
        cred.user.displayName ||
        cred.user.email?.split('@')[0] ||
        'Cinema Admirer',
      email: cred.user.email || existing?.email || '',
      avatar: cred.user.photoURL || existing?.avatar || undefined,
      preferredGenres: existing?.preferredGenres || ['Science Fiction', 'Drama'],
      notificationPreferences: existing?.notificationPreferences || {
        emailAlerts: true,
        newReleases: true,
        curatedWeekly: false
      },
      playbackPreferences: existing?.playbackPreferences || {
        autoplayTrailers: true
      },
      createdAt: existing?.createdAt || new Date().toISOString(),
      isAdmin: cred.user.email === 'danny2010qwert@gmail.com' && cred.user.emailVerified
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
    displayName: (displayName || email.split('@')[0]).slice(0, 100),
    email: (cred.user.email || email).slice(0, 150),
    preferredGenres: ['Science Fiction', 'Drama'],
    notificationPreferences: {
      emailAlerts: true,
      newReleases: true,
      curatedWeekly: false
    },
    playbackPreferences: {
      autoplayTrailers: true
    },
    createdAt: new Date().toISOString(),
    isAdmin: email.toLowerCase() === 'danny2010qwert@gmail.com' && cred.user.emailVerified
  };
  await saveUserProfile(profile);
  return profile;
}

export async function loginWithEmailPassword(email: string, pass: string): Promise<UserProfile | null> {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  const saved = await getUserProfile(cred.user.uid);
  const isVerifiedAdmin = cred.user.email === 'danny2010qwert@gmail.com' && cred.user.emailVerified;
  if (saved) return { ...saved, isAdmin: isVerifiedAdmin };
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
    playbackPreferences: {
      autoplayTrailers: true
    },
    createdAt: new Date().toISOString(),
    isAdmin: isVerifiedAdmin
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

export async function getAuthIdToken(): Promise<string | null> {
  try {
    if (!auth.currentUser) return null;
    return await auth.currentUser.getIdToken();
  } catch {
    return null;
  }
}

// ======================== USER PROFILE FIRESTORE ========================

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const path = `users/${profile.uid}`;
  try {
    await setDoc(doc(db, 'users', profile.uid), {
      ...profile,
      displayName: (profile.displayName || 'Cinema Admirer').slice(0, 100),
      email: (profile.email || '').slice(0, 150),
      ...(profile.avatar ? { avatar: profile.avatar.slice(0, 500) } : {}),
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

export async function fetchAdminUserAnalytics(): Promise<{
  userCount: number | null;
  userGenreLists: string[][];
}> {
  if (!auth.currentUser) {
    return { userCount: null, userGenreLists: [] };
  }
  const path = 'users';
  try {
    const snap = await getDocs(collection(db, 'users'));
    const userGenreLists: string[][] = [];
    snap.docs.forEach((d) => {
      const data = d.data() as Partial<UserProfile>;
      if (Array.isArray(data.preferredGenres) && data.preferredGenres.length > 0) {
        userGenreLists.push(data.preferredGenres);
      }
    });
    return {
      userCount: snap.size,
      userGenreLists
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return { userCount: null, userGenreLists: [] };
  }
}

// ======================== WATCHLIST FIRESTORE ========================

export async function fetchUserWatchlist(userId: string): Promise<WatchlistItem[] | null> {
  const path = `users/${userId}/watchlist`;
  try {
    const colRef = collection(db, 'users', userId, 'watchlist');
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map((d) => d.data() as WatchlistItem);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return null;
  }
}

export async function addToUserWatchlist(userId: string, entry: WatchlistItem): Promise<void> {
  const path = `users/${userId}/watchlist/${entry.mediaId}`;
  try {
    const cleanEntry: WatchlistItem = {
      id: (entry.id || `wl_${entry.mediaId}`).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128),
      mediaId: Number(entry.mediaId),
      mediaType: entry.mediaType === 'tv' ? 'tv' : 'movie',
      title: (entry.title || 'Untitled').slice(0, 200),
      posterPath: (entry.posterPath || '').slice(0, 500),
      ...(entry.backdropPath ? { backdropPath: entry.backdropPath.slice(0, 500) } : {}),
      voteAverage: Number.isFinite(entry.voteAverage) ? Math.min(10, Math.max(0, Number(entry.voteAverage))) : 0,
      ...(entry.releaseDate ? { releaseDate: entry.releaseDate.slice(0, 50) } : {}),
      genres: Array.isArray(entry.genres) ? entry.genres.slice(0, 10) : [],
      addedAt: (entry.addedAt || new Date().toISOString()).slice(0, 64)
    };
    await setDoc(doc(db, 'users', userId, 'watchlist', String(entry.mediaId)), cleanEntry);
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

export async function fetchUserFavorites(userId: string): Promise<FavoriteItem[] | null> {
  const path = `users/${userId}/favorites`;
  try {
    const colRef = collection(db, 'users', userId, 'favorites');
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map((d) => d.data() as FavoriteItem);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return null;
  }
}

export async function addToUserFavorites(userId: string, entry: FavoriteItem): Promise<void> {
  const path = `users/${userId}/favorites/${entry.mediaId}`;
  try {
    const cleanEntry: FavoriteItem = {
      id: (entry.id || `fav_${entry.mediaId}`).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128),
      mediaId: Number(entry.mediaId),
      mediaType: entry.mediaType === 'tv' ? 'tv' : 'movie',
      title: (entry.title || 'Untitled').slice(0, 200),
      posterPath: (entry.posterPath || '').slice(0, 500),
      ...(entry.backdropPath ? { backdropPath: entry.backdropPath.slice(0, 500) } : {}),
      voteAverage: Number.isFinite(entry.voteAverage) ? Math.min(10, Math.max(0, Number(entry.voteAverage))) : 0,
      ...(entry.releaseDate ? { releaseDate: entry.releaseDate.slice(0, 50) } : {}),
      genres: Array.isArray(entry.genres) ? entry.genres.slice(0, 10) : [],
      addedAt: (entry.addedAt || new Date().toISOString()).slice(0, 64)
    };
    await setDoc(doc(db, 'users', userId, 'favorites', String(entry.mediaId)), cleanEntry);
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

// ======================== WATCH HISTORY FIRESTORE ========================

export async function fetchUserWatchHistory(userId: string): Promise<WatchHistoryItem[] | null> {
  const path = `users/${userId}/watchHistory`;
  try {
    const colRef = collection(db, 'users', userId, 'watchHistory');
    const q = query(colRef, orderBy('viewedAt', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => sanitizeWatchHistoryItem(d.data() as WatchHistoryItem));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return null;
  }
}

export async function recordUserWatchHistory(userId: string, entry: WatchHistoryItem): Promise<void> {
  const sanitized = sanitizeWatchHistoryItem(entry);
  const path = `users/${userId}/watchHistory/${sanitized.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'watchHistory', sanitized.id), sanitized);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function removeUserWatchHistoryItem(userId: string, entryId: string): Promise<void> {
  const path = `users/${userId}/watchHistory/${entryId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'watchHistory', entryId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function clearUserWatchHistory(userId: string): Promise<void> {
  const path = `users/${userId}/watchHistory`;
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'watchHistory'));
    if (!snap.empty) {
      await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// ======================== CUSTOM COLLECTIONS FIRESTORE ========================

export async function fetchUserCustomCollections(userId: string): Promise<CustomCollection[] | null> {
  const path = `collections?ownerId=${userId}`;
  try {
    const q = query(collection(db, 'collections'), where('ownerId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => sanitizeCustomCollection(d.data() as CustomCollection))
      .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return null;
  }
}

export async function fetchPublicCustomCollection(collectionId: string): Promise<CustomCollection | null> {
  const safeId = (collectionId || '').replace(/[^a-zA-Z0-9_-]/g, '');
  if (!safeId) return null;
  const path = `collections/${safeId}`;
  try {
    const snap = await getDoc(doc(db, 'collections', safeId));
    if (snap.exists()) {
      return sanitizeCustomCollection(snap.data() as CustomCollection);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
  return null;
}

export async function saveCustomCollection(col: CustomCollection): Promise<boolean> {
  const sanitized = sanitizeCustomCollection(col);
  const path = `collections/${sanitized.id}`;
  try {
    await setDoc(doc(db, 'collections', sanitized.id), sanitized);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return false;
  }
}

export async function deleteCustomCollection(collectionId: string): Promise<boolean> {
  const safeId = (collectionId || '').replace(/[^a-zA-Z0-9_-]/g, '');
  if (!safeId) return false;
  const path = `collections/${safeId}`;
  try {
    await deleteDoc(doc(db, 'collections', safeId));
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    return false;
  }
}

// ======================== REVIEWS FIRESTORE ========================

export async function publishFirestoreReview(review: UserReview): Promise<boolean> {
  const path = `reviews/${review.id}`;
  try {
    const sanitized: UserReview =
      typeof review.starRating === 'number' && Number.isFinite(review.starRating)
        ? buildStarReviewDocument({
            id: review.id,
            userId: review.userId,
            userName: review.userName,
            userAvatar: review.userAvatar,
            mediaId: review.mediaId,
            mediaType: review.mediaType,
            starRating: clampStarRating(review.starRating),
            reviewText: review.reviewText,
            status: review.status || 'published',
            createdAt: review.createdAt,
            ...(review.updatedAt ? { updatedAt: review.updatedAt } : {}),
            helpfulCount: review.helpfulCount ?? 0
          })
        : {
            id: review.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128),
            userId: review.userId,
            userName: (review.userName || 'ASTREON Member').trim().slice(0, 100) || 'ASTREON Member',
            ...(review.userAvatar ? { userAvatar: review.userAvatar.slice(0, 500) } : {}),
            mediaId: Number(review.mediaId),
            mediaType: review.mediaType,
            rating: Math.min(10, Math.max(1, Number(review.rating))),
            reviewText: review.reviewText.trim().slice(0, 2000),
            status: review.status || 'published',
            createdAt: review.createdAt,
            helpfulCount: review.helpfulCount ?? 0
          };
    await setDoc(doc(db, 'reviews', sanitized.id), sanitized);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return false;
  }
}

export async function updateFirestoreReview(
  reviewId: string,
  existingReview: UserReview,
  updates: { rating: number; starRating?: number; reviewText: string }
): Promise<boolean> {
  const path = `reviews/${reviewId}`;
  try {
    const nowIso = new Date().toISOString();
    const payload: UserReview =
      typeof updates.starRating === 'number' && Number.isFinite(updates.starRating)
        ? buildStarReviewDocument({
            id: existingReview.id,
            userId: existingReview.userId,
            userName: existingReview.userName,
            userAvatar: existingReview.userAvatar,
            mediaId: existingReview.mediaId,
            mediaType: existingReview.mediaType,
            starRating: clampStarRating(updates.starRating),
            reviewText: updates.reviewText,
            status: existingReview.status || 'published',
            createdAt: existingReview.createdAt,
            updatedAt: nowIso,
            helpfulCount: existingReview.helpfulCount ?? 0
          })
        : {
            id: existingReview.id,
            userId: existingReview.userId,
            userName: (existingReview.userName || 'ASTREON Member').trim().slice(0, 100) || 'ASTREON Member',
            ...(existingReview.userAvatar ? { userAvatar: existingReview.userAvatar.slice(0, 500) } : {}),
            mediaId: Number(existingReview.mediaId),
            mediaType: existingReview.mediaType,
            rating: Math.min(10, Math.max(1, Number(updates.rating))),
            reviewText: updates.reviewText.trim().slice(0, 2000),
            status: existingReview.status || 'published',
            createdAt: existingReview.createdAt,
            updatedAt: nowIso,
            helpfulCount: existingReview.helpfulCount ?? 0
          };
    await setDoc(doc(db, 'reviews', reviewId), payload);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    return false;
  }
}

export async function deleteFirestoreReview(reviewId: string): Promise<boolean> {
  const path = `reviews/${reviewId}`;
  try {
    await deleteDoc(doc(db, 'reviews', reviewId));
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    return false;
  }
}

export async function moderateFirestoreReview(
  reviewId: string,
  status: 'published' | 'flagged'
): Promise<boolean> {
  const path = `reviews/${reviewId}`;
  try {
    await updateDoc(doc(db, 'reviews', reviewId), { status });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    return false;
  }
}

export async function toggleReviewHelpfulInFirestore(
  reviewId: string,
  userId: string
): Promise<{ helpfulCount: number; voted: boolean } | null> {
  const path = `reviews/${reviewId}/helpfulVotes/${userId}`;
  try {
    const reviewRef = doc(db, 'reviews', reviewId);
    const voteRef = doc(db, 'reviews', reviewId, 'helpfulVotes', userId);
    return await runTransaction(db, async (tx) => {
      const [reviewSnap, voteSnap] = await Promise.all([tx.get(reviewRef), tx.get(voteRef)]);
      if (!reviewSnap.exists()) return null;
      const currentCount = Number(reviewSnap.data()?.helpfulCount || 0);
      if (voteSnap.exists()) {
        const nextCount = Math.max(0, currentCount - 1);
        tx.delete(voteRef);
        tx.update(reviewRef, { helpfulCount: nextCount });
        return { helpfulCount: nextCount, voted: false };
      } else {
        const nextCount = currentCount + 1;
        tx.set(voteRef, { userId, createdAt: new Date().toISOString() });
        tx.update(reviewRef, { helpfulCount: nextCount });
        return { helpfulCount: nextCount, voted: true };
      }
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return null;
  }
}

export async function fetchUserHelpfulVoteIds(
  userId: string,
  reviewIds: string[]
): Promise<string[]> {
  if (!userId || reviewIds.length === 0) return [];
  try {
    const checks = await Promise.all(
      reviewIds.slice(0, 30).map(async (id) => {
        const snap = await getDoc(doc(db, 'reviews', id, 'helpfulVotes', userId));
        return snap.exists() ? id : null;
      })
    );
    return checks.filter((id): id is string => Boolean(id));
  } catch {
    return [];
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
    return snapshot.docs.map((d) => {
      const data = d.data() as UserReview;
      return {
        ...data,
        helpfulCount: data.helpfulCount ?? 0
      };
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

// ======================== SEARCH HISTORY FIRESTORE ========================

export async function saveSearchQueryToFirestore(userId: string, queryText: string): Promise<void> {
  const normalized = queryText.trim().slice(0, 200);
  if (!normalized) return;
  const entryId = String(Date.now());
  const path = `users/${userId}/searchHistory/${entryId}`;
  try {
    await setDoc(doc(db, 'users', userId, 'searchHistory', entryId), {
      query: normalized,
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

// ======================== EDITORIAL NEWS FIRESTORE ========================

export async function fetchFirestoreNews(): Promise<NewsArticle[]> {
  const path = 'news';
  try {
    const snap = await getDocs(query(collection(db, 'news'), orderBy('publishedAt', 'desc')));
    return snap.docs.map((d) => d.data() as NewsArticle);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

export async function publishFirestoreArticle(article: NewsArticle): Promise<boolean> {
  const path = `news/${article.id}`;
  try {
    await setDoc(doc(db, 'news', article.id), article);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return false;
  }
}

export async function updateFirestoreArticle(
  articleId: string,
  updates: Partial<NewsArticle>
): Promise<boolean> {
  const path = `news/${articleId}`;
  try {
    await setDoc(doc(db, 'news', articleId), updates, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    return false;
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
      targetId: targetId.slice(0, 128),
      reason: reason.slice(0, 1000),
      status: 'pending',
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function appendAdminAuditLogToFirestore(log: AdminAuditLog): Promise<boolean> {
  const path = `adminAuditLogs/${log.id}`;
  try {
    await setDoc(doc(db, 'adminAuditLogs', log.id), {
      ...log,
      targetId: String(log.targetId).slice(0, 128),
      details: log.details.slice(0, 1000)
    });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return false;
  }
}

export async function fetchAdminAuditLogsFromFirestore(): Promise<AdminAuditLog[]> {
  if (!auth.currentUser) {
    return [];
  }
  const path = 'adminAuditLogs';
  try {
    const snap = await getDocs(query(collection(db, 'adminAuditLogs'), orderBy('timestamp', 'desc')));
    return snap.docs.map((d) => d.data() as AdminAuditLog);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

// ======================== ACCOUNT DELETION ========================

export async function deleteUserAccountFromFirebase(userId: string): Promise<void> {
  const path = `users/${userId}`;
  try {
    const subcollections = ['watchlist', 'favorites', 'watchHistory', 'searchHistory'] as const;
    for (const sub of subcollections) {
      const snap = await getDocs(collection(db, 'users', userId, sub));
      if (!snap.empty) {
        await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
      }
    }
    const colsSnap = await getDocs(query(collection(db, 'collections'), where('ownerId', '==', userId)));
    if (!colsSnap.empty) {
      await Promise.all(colsSnap.docs.map((d) => deleteDoc(d.ref)));
    }
    await deleteDoc(doc(db, 'users', userId));
    if (auth.currentUser && auth.currentUser.uid === userId) {
      await auth.currentUser.delete();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    throw err;
  }
}

