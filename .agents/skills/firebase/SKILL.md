---
name: firebase
description: Build apps with Firebase (Firestore, Auth, Storage, Functions). Use when using Firebase Authentication, Firestore database queries, Firebase Storage, Cloud Functions, Realtime Database, or integrating Firebase with React/Next.js.
---

# Firebase Expert Guide

## Setup

```bash
npm install firebase
npm install -g firebase-tools
firebase login
firebase init
```

```typescript
// lib/firebase.ts
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
export const storage = getStorage(app)
```

## Authentication

```typescript
import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged,
  sendPasswordResetEmail, updateProfile,
} from 'firebase/auth'
import { auth } from './firebase'

// Email/password
const { user } = await signInWithEmailAndPassword(auth, email, password)
await createUserWithEmailAndPassword(auth, email, password)

// Google OAuth
const provider = new GoogleAuthProvider()
const { user } = await signInWithPopup(auth, provider)

// Sign out
await signOut(auth)

// Password reset
await sendPasswordResetEmail(auth, email)

// Listen to auth state
onAuthStateChanged(auth, (user) => {
  if (user) console.log('Signed in:', user.uid)
  else console.log('Signed out')
})

// Update profile
await updateProfile(auth.currentUser!, { displayName: 'Alice', photoURL: url })

// Get current user
const user = auth.currentUser
const token = await user?.getIdToken()  // for API calls
```

## Firestore CRUD

```typescript
import {
  collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, startAfter, onSnapshot,
  serverTimestamp, arrayUnion, arrayRemove, increment,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

// CREATE
const docRef = await addDoc(collection(db, 'users'), {
  name: 'Alice',
  email: 'alice@example.com',
  createdAt: serverTimestamp(),
})
// With custom ID:
await setDoc(doc(db, 'users', userId), { name: 'Alice', role: 'admin' })

// READ single
const docSnap = await getDoc(doc(db, 'users', userId))
if (docSnap.exists()) {
  const user = { id: docSnap.id, ...docSnap.data() }
}

// READ collection
const snapshot = await getDocs(collection(db, 'users'))
const users = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))

// QUERY
const q = query(
  collection(db, 'posts'),
  where('published', '==', true),
  where('authorId', '==', userId),
  orderBy('createdAt', 'desc'),
  limit(10)
)
const snapshot = await getDocs(q)

// UPDATE (merge)
await updateDoc(doc(db, 'users', userId), {
  name: 'Bob',
  updatedAt: serverTimestamp(),
})

// Atomic operations
await updateDoc(doc(db, 'post', postId), {
  likes: increment(1),
  tags: arrayUnion('typescript'),
  oldTags: arrayRemove('javascript'),
})

// DELETE
await deleteDoc(doc(db, 'users', userId))
```

## Realtime Listeners

```typescript
// Single document — auto-updates
const unsubscribe = onSnapshot(doc(db, 'users', userId), (snap) => {
  const user = snap.exists() ? { id: snap.id, ...snap.data() } : null
  setUser(user)
})

// Collection query — auto-updates
const q = query(collection(db, 'messages'), orderBy('createdAt'), limit(50))
const unsubscribe = onSnapshot(q, (snapshot) => {
  const messages = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
  setMessages(messages)
})

// Cleanup in React
useEffect(() => {
  const unsub = onSnapshot(...)
  return () => unsub()  // cleanup on unmount
}, [userId])
```

## Pagination

```typescript
const PAGE_SIZE = 20
let lastDoc: DocumentSnapshot | null = null

async function loadMore() {
  let q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE))
  if (lastDoc) q = query(q, startAfter(lastDoc))

  const snapshot = await getDocs(q)
  lastDoc = snapshot.docs[snapshot.docs.length - 1] ?? null
  const newPosts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
  setPosts(prev => [...prev, ...newPosts])
}
```

## Storage

```typescript
import { ref, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from './firebase'

// Simple upload
const storageRef = ref(storage, `avatars/${userId}/${file.name}`)
await uploadBytes(storageRef, file)
const url = await getDownloadURL(storageRef)

// Upload with progress
const uploadTask = uploadBytesResumable(storageRef, file)
uploadTask.on('state_changed',
  (snapshot) => {
    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
    setProgress(progress)
  },
  (error) => console.error(error),
  async () => {
    const url = await getDownloadURL(uploadTask.snapshot.ref)
    setAvatarUrl(url)
  }
)

// Delete
await deleteObject(ref(storage, `avatars/${userId}/old.jpg`))
```

## Security Rules (firestore.rules)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own profile
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }

    // Posts: anyone can read published, only author can write
    match /posts/{postId} {
      allow read: if resource.data.published == true || request.auth.uid == resource.data.authorId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.authorId;
      allow update, delete: if request.auth.uid == resource.data.authorId;
    }

    // Admin-only
    match /admin/{document=**} {
      allow read, write: if request.auth.token.admin == true;
    }
  }
}
```
