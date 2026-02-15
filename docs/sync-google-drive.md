# Sync via Google Drive API

## Overview

Store the investment data as a JSON file in the user's Google Drive. The app authenticates via OAuth 2.0 (Google Identity Services), then uses the Google Drive REST API v3 to upload and download a single `investments.json` file. The file lives in a dedicated app folder or a known folder in the user's Drive, so it is accessible across devices wherever the user signs in.

## Pros and Cons

### Pros

- Data stays in the user's own Google account -- no third-party server to maintain.
- Free with generous quota (Drive API allows 20,000 queries/day on the free tier).
- Google Identity Services (GIS) provides a well-documented, browser-native OAuth flow with no backend required.
- The `appDataFolder` scope keeps the file invisible to the user, avoiding clutter.
- Works well for a single-user SPA with no backend.

### Cons

- Requires creating a Google Cloud project, configuring OAuth consent screen, and managing client IDs.
- OAuth consent screen must go through Google verification for production use (or stay in "Testing" mode limited to 100 test users).
- Token refresh adds complexity -- access tokens expire after 1 hour; the GIS library handles prompt-based re-auth but not silent refresh without a backend.
- Google may change API surface or deprecate libraries (they deprecated the older `gapi.auth2` in favor of GIS).
- Heavier dependency footprint compared to simpler approaches.
- Merge conflicts are possible if the user edits on two devices without pulling first (last-write-wins).

## Dependencies and Configuration

### New dependencies

None required as npm packages. The Google Identity Services library and Drive API client are loaded via `<script>` tags or dynamically:

```html
<!-- index.html -->
<script src="https://accounts.google.com/gsi/client" async defer></script>
<script src="https://apis.google.com/js/api.js" async defer></script>
```

Alternatively, use the `google-auth-library` npm package if you want to avoid script tags, but for a pure SPA the script approach is standard.

### Type declarations

```bash
yarn add -D @types/gapi @types/gapi.drive
```

### Environment variables

Add to `.env` (and `.env.example`):

```
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_GOOGLE_APP_ID=your-project-id
```

Add `VITE_GOOGLE_CLIENT_ID` and `VITE_GOOGLE_APP_ID` to `.gitignore` guidance or `.env.example`.

### Google Cloud Console setup

1. Create a project at https://console.cloud.google.com/.
2. Enable the Google Drive API.
3. Configure OAuth consent screen (External, Testing mode for personal use).
4. Create an OAuth 2.0 Client ID (Web application), adding `http://localhost:5173` and your production URL as authorized JavaScript origins.

## High-Level Implementation Steps

### 1. Create `src/services/google-drive.ts`

This module encapsulates all Google Drive logic:

```ts
// src/services/google-drive.ts
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata'
const FILE_NAME = 'investments.json'

let tokenClient: google.accounts.oauth2.TokenClient
let accessToken = ''

export function initGoogleAuth(): Promise<void> {
  // Initialize the GIS token client
  // Resolve when gapi.client is loaded and discovery doc for Drive v3 is loaded
}

export async function signIn(): Promise<void> {
  // Request an access token via tokenClient.requestAccessToken()
}

export async function pushData(data: unknown): Promise<void> {
  // Search for existing file in appDataFolder by name
  // If found, update via PATCH multipart upload
  // If not found, create via POST multipart upload
}

export async function pullData(): Promise<unknown> {
  // Search for file in appDataFolder by name
  // Download content via files.get with alt=media
  // Parse and return JSON
}
```

### 2. Add sync actions to the Pinia store

In `src/stores/investments.ts`, add two new actions:

```ts
async function pushToRemote() {
  // Call pushData(institutions.value)
  // Show success/error feedback
}

async function pullFromRemote() {
  // Call pullData()
  // Replace institutions.value with pulled data
  // Save to localStorage
}
```

### 3. Create `src/components/SyncControls.vue`

A small component with Push and Pull buttons, plus a Sign In button if not authenticated:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useInvestmentsStore } from '@/stores/investments'

const store = useInvestmentsStore()
const syncing = ref(false)

async function handlePush() {
  syncing.value = true
  await store.pushToRemote()
  syncing.value = false
}

async function handlePull() {
  syncing.value = true
  await store.pullFromRemote()
  syncing.value = false
}
</script>

<template>
  <div class="sync-controls">
    <button :disabled="syncing" @click="handlePush">Push</button>
    <button :disabled="syncing" @click="handlePull">Pull</button>
  </div>
</template>
```

### 4. Add SyncControls to DashboardView

Place the component in the header row of `src/views/DashboardView.vue`, next to the existing "Add Entry" button.

### 5. Update `index.html`

Add the Google script tags (GIS and gapi loader).

### 6. Update type declarations

Add `src/types/google.d.ts` or install `@types/gapi` to satisfy TypeScript.

## How Push and Pull Work

### Push

1. User clicks "Push" in `SyncControls`.
2. If no access token, trigger `signIn()` which opens the Google OAuth popup.
3. Serialize `institutions.value` to JSON.
4. Search `appDataFolder` for a file named `investments.json`.
5. If the file exists, update it with a `PATCH` request (multipart media upload).
6. If the file does not exist, create it with a `POST` request.
7. Display success or error status.

### Pull

1. User clicks "Pull" in `SyncControls`.
2. If no access token, trigger `signIn()`.
3. Search `appDataFolder` for `investments.json`.
4. Download the file content via `files.get` with `alt=media`.
5. Parse the JSON and validate it matches the `InstitutionData[]` shape.
6. Replace `institutions.value` and call `saveData()` to update localStorage.
7. Display success or error status.

## Security Considerations

- **OAuth scope**: Use `drive.appdata` (not `drive.file` or `drive`) to limit access strictly to the app's hidden folder. The app cannot read or modify any other files in the user's Drive.
- **Client ID exposure**: The OAuth client ID is public by design in SPAs. Security relies on the authorized origins list in Google Cloud Console, not on keeping the client ID secret.
- **Token storage**: Do not persist the access token to localStorage. Keep it in memory only. The GIS library handles re-prompting when the token expires.
- **CORS**: Google APIs support CORS for browser requests, so no proxy is needed.
- **Content validation**: Always validate the shape of pulled data before replacing local state to prevent corruption from a tampered file.
- **Consent screen**: For personal/small-scale use, "Testing" mode is fine (up to 100 test users). For broader distribution, you would need to go through Google's verification process.
- **No server-side secret**: Since this is a pure SPA, there is no client secret. The OAuth flow uses the "implicit" or "authorization code with PKCE" model. Google recommends the latter for SPAs as of 2024+.
