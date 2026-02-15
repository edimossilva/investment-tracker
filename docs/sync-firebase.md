# Sync via Firebase (Firestore)

## Overview

Store the investment data in a Cloud Firestore database within a Firebase project. The app uses the Firebase JS SDK to authenticate the user (Firebase Authentication with email/password or Google sign-in) and then reads/writes documents in Firestore. Each user gets their own document (or subcollection) containing the full `InstitutionData[]` array.

Firestore is preferred over Realtime Database here because it offers a more flexible data model, better querying, and offline persistence out of the box. However, Realtime Database would also work for this use case with minimal differences in implementation.

## Pros and Cons

### Pros

- Firebase has a generous free tier (Spark plan): 1 GiB storage, 50K reads/day, 20K writes/day, 20K deletes/day.
- Firebase Authentication provides ready-made auth flows (Google, email/password, anonymous) with no backend.
- Firestore offers built-in offline persistence -- reads work even when offline, and writes are queued and synced when connectivity returns.
- Real-time listeners (`onSnapshot`) can be added later to enable live sync across devices.
- The Firebase JS SDK is well-maintained and has good TypeScript support.
- Multi-user support is straightforward if the app ever needs it (each user writes to their own path).

### Cons

- Requires creating and configuring a Firebase project (Firebase Console setup).
- Adds a significant dependency (`firebase` npm package is ~200KB gzipped when tree-shaken for auth + firestore).
- Firebase config values are embedded in the client code (safe by design, but feels unusual).
- The free tier has daily limits. If the app were to add real-time listeners or frequent polling, it could approach read limits.
- Vendor lock-in to Google Cloud/Firebase infrastructure.
- Security rules must be written and maintained to ensure users can only access their own data.
- Slightly more complex than the GitHub Gist approach for a single-user, manual push/pull use case.

## Dependencies and Configuration

### New dependencies

```bash
yarn add firebase
```

This installs the modular Firebase SDK (v9+). Only the modules you import are bundled (tree-shaking).

### Firebase project setup

1. Go to https://console.firebase.google.com/ and create a new project.
2. Enable Firestore Database (start in test mode for development, then lock down with security rules).
3. Enable Authentication and add at least one sign-in provider (Google is the simplest for an SPA).
4. Go to Project Settings and copy the Firebase config object.

### Environment variables

Add to `.env` (and create `.env.example` for documentation):

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### Firestore data structure

```
users/
  {userId}/
    investments (document)
      data: InstitutionData[]   // stored as a JSON-compatible array
      updatedAt: Timestamp
```

Alternatively, if the data is large, store each institution as a separate document in a subcollection. For typical investment tracker data (a few hundred records), a single document works fine and keeps push/pull logic simple.

Note: Firestore has a 1 MiB document size limit. If the data approaches this, consider splitting into subcollections.

## High-Level Implementation Steps

### 1. Create `src/services/firebase.ts`

Initialize the Firebase app and export the auth and firestore instances:

```ts
// src/services/firebase.ts
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()
```

### 2. Create `src/services/firestore-sync.ts`

```ts
// src/services/firestore-sync.ts
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase'
import type { InstitutionData } from '@/types/investment'

function getUserDocRef() {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')
  return doc(db, 'users', user.uid, 'data', 'investments')
}

export async function pushData(data: InstitutionData[]): Promise<void> {
  const ref = getUserDocRef()
  await setDoc(ref, {
    institutions: JSON.parse(JSON.stringify(data)),
    updatedAt: serverTimestamp(),
  })
}

export async function pullData(): Promise<InstitutionData[]> {
  const ref = getUserDocRef()
  const snapshot = await getDoc(ref)
  if (!snapshot.exists()) {
    throw new Error('No remote data found')
  }
  return snapshot.data().institutions as InstitutionData[]
}
```

### 3. Create `src/composables/useAuth.ts`

A composable to manage Firebase auth state:

```ts
// src/composables/useAuth.ts
import { ref, onMounted } from 'vue'
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut } from 'firebase/auth'
import { auth, googleProvider } from '@/services/firebase'

export function useAuth() {
  const user = ref(auth.currentUser)
  const loading = ref(true)

  onMounted(() => {
    onAuthStateChanged(auth, (u) => {
      user.value = u
      loading.value = false
    })
  })

  async function signIn() {
    await signInWithPopup(auth, googleProvider)
  }

  async function signOut() {
    await fbSignOut(auth)
  }

  return { user, loading, signIn, signOut }
}
```

### 4. Add sync actions to the Pinia store

In `src/stores/investments.ts`:

```ts
import { pushData, pullData } from '@/services/firestore-sync'

async function pushToRemote() {
  await pushData(institutions.value)
}

async function pullFromRemote() {
  const data = await pullData()
  institutions.value = data
  selectedInstitutions.value = new Set(data.map((d) => d.institution))
  saveData()
}
```

### 5. Create `src/components/SyncControls.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useInvestmentsStore } from '@/stores/investments'
import { useAuth } from '@/composables/useAuth'

const store = useInvestmentsStore()
const { user, signIn, signOut } = useAuth()
const syncing = ref(false)
const status = ref('')

async function handlePush() {
  syncing.value = true
  status.value = ''
  try {
    await store.pushToRemote()
    status.value = 'Pushed'
  } catch (e) {
    status.value = 'Push failed'
  }
  syncing.value = false
}

async function handlePull() {
  syncing.value = true
  status.value = ''
  try {
    await store.pullFromRemote()
    status.value = 'Pulled'
  } catch (e) {
    status.value = 'Pull failed'
  }
  syncing.value = false
}
</script>

<template>
  <div class="sync-controls">
    <template v-if="user">
      <span>{{ user.displayName }}</span>
      <button :disabled="syncing" @click="handlePush">Push</button>
      <button :disabled="syncing" @click="handlePull">Pull</button>
      <button @click="signOut">Sign Out</button>
      <span v-if="status">{{ status }}</span>
    </template>
    <template v-else>
      <button @click="signIn">Sign in with Google</button>
    </template>
  </div>
</template>
```

### 6. Add SyncControls to DashboardView

Place the component in the header row of `src/views/DashboardView.vue`.

### 7. Deploy Firestore security rules

Create `firestore.rules`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Deploy via Firebase CLI (`firebase deploy --only firestore:rules`) or set them in the Firebase Console.

## How Push and Pull Work

### Push

1. User clicks "Push".
2. If not signed in, the Google sign-in popup opens. After sign-in, the auth state is stored by Firebase SDK (persisted in IndexedDB by default).
3. Serialize `institutions.value` to a plain object.
4. Write to `users/{uid}/data/investments` using `setDoc` (full overwrite).
5. Firestore adds a server-generated `updatedAt` timestamp.
6. Display success or error.

### Pull

1. User clicks "Pull".
2. If not signed in, prompt sign-in first.
3. Read from `users/{uid}/data/investments` using `getDoc`.
4. If the document does not exist, display "No remote data found".
5. Extract the `institutions` array, validate its shape, and replace `institutions.value`.
6. Call `saveData()` to update localStorage.
7. Display success or error.

### Optional future enhancement: real-time sync

Replace the manual pull with an `onSnapshot` listener on the user's document. Any change written from another device would automatically update the local state. This is a natural extension of the Firestore approach but adds complexity around conflict resolution.

## Security Considerations

- **Firebase config in client code**: The Firebase config object (API key, project ID, etc.) is designed to be public. Security is enforced by Firestore security rules and Firebase Authentication, not by keeping the config secret.
- **Firestore security rules**: The rules above ensure each user can only read and write their own documents. Always test rules using the Firebase Emulator Suite before deploying.
- **Authentication**: Firebase Auth handles token management, refresh, and session persistence automatically. No manual token storage is needed.
- **Data validation in rules**: For added safety, add schema validation in the Firestore rules to reject malformed writes:
  ```
  allow write: if request.auth.uid == userId
    && request.resource.data.institutions is list
    && request.resource.data.updatedAt is timestamp;
  ```
- **Billing**: The Spark (free) plan has no charges, but if you upgrade to Blaze for other Firebase features, Firestore usage is pay-as-you-go. Set up budget alerts.
- **XSS**: Firebase Auth tokens are stored in IndexedDB, not localStorage, which provides slightly better isolation. However, XSS on the same origin can still access them.
- **Offline persistence**: Firestore's offline cache is enabled by default on web. Be aware that cached data is stored in IndexedDB in the clear. For sensitive financial data, consider whether this is acceptable.
- **CORS and domain restrictions**: Restrict the authorized domains in Firebase Authentication settings to only your production domain and localhost.
