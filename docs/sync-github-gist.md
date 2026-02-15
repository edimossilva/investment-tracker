# Sync via GitHub Gists

## Overview

Store the investment data as a secret GitHub Gist containing a single `investments.json` file. The app uses the GitHub Gists REST API to create, update, and fetch the gist. Authentication is handled via a GitHub Personal Access Token (PAT) that the user enters in the app's settings UI. The token is stored in localStorage and sent as a Bearer token in API requests.

This is the simplest approach of the three proposals -- no OAuth flow, no SDK, no third-party project setup. Just a PAT and plain `fetch` calls.

## Pros and Cons

### Pros

- Extremely simple to implement -- the Gists API is straightforward REST with no SDK required.
- No project setup on any cloud console. The user just generates a PAT on GitHub.
- Secret gists are not discoverable via search, though they are accessible to anyone with the URL.
- Free, with no usage limits that matter for this use case (5,000 requests/hour for authenticated users).
- Zero new dependencies. Uses the browser's native `fetch`.
- Version history comes for free -- every gist update creates a revision that can be viewed on GitHub.

### Cons

- Requires the user to have a GitHub account and know how to create a PAT.
- Secret gists are not truly private -- anyone with the URL can view them. They are just unlisted.
- The PAT must be stored somewhere in the browser. localStorage is the pragmatic choice but is vulnerable to XSS.
- PATs with the `gist` scope can read and write all of the user's gists, not just this one.
- GitHub's API has a 1 MB size limit per file in a gist (unlikely to matter for investment data, but worth noting).
- No real-time sync or conflict detection -- last write wins.
- Fine-grained PATs (beta) can scope to gists only, but classic PATs grant broader access.

## Dependencies and Configuration

### New dependencies

None. The implementation uses the native `fetch` API.

### Environment variables

None required at build time. The GitHub PAT is entered by the user at runtime and stored in localStorage.

Optionally, if you want to pre-configure a gist ID for development:

```
VITE_GITHUB_GIST_ID=your-gist-id-here
```

### GitHub PAT setup (user-facing)

1. Go to https://github.com/settings/tokens.
2. Generate a new token (classic) with the `gist` scope only.
3. Alternatively, use a fine-grained PAT scoped to "Gists: Read and write" (if available).
4. Copy the token and paste it into the app's sync settings.

## High-Level Implementation Steps

### 1. Create `src/services/github-gist.ts`

```ts
// src/services/github-gist.ts
const API_BASE = 'https://api.github.com'
const FILE_NAME = 'investments.json'
const TOKEN_KEY = 'github-pat'
const GIST_ID_KEY = 'github-gist-id'

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

function getGistId(): string | null {
  return localStorage.getItem(GIST_ID_KEY)
}

function headers(): HeadersInit {
  return {
    Authorization: `Bearer ${getToken()}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  }
}

export async function pushData(data: unknown): Promise<void> {
  const gistId = getGistId()
  const body = {
    description: 'Investment Tracker data',
    public: false,
    files: {
      [FILE_NAME]: { content: JSON.stringify(data, null, 2) },
    },
  }

  if (gistId) {
    // Update existing gist
    await fetch(`${API_BASE}/gists/${gistId}`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify(body),
    })
  } else {
    // Create new gist
    const res = await fetch(`${API_BASE}/gists`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    })
    const created = await res.json()
    localStorage.setItem(GIST_ID_KEY, created.id)
  }
}

export async function pullData(): Promise<unknown> {
  const gistId = getGistId()
  if (!gistId) throw new Error('No gist ID configured')

  const res = await fetch(`${API_BASE}/gists/${gistId}`, {
    headers: headers(),
  })
  const gist = await res.json()
  const content = gist.files?.[FILE_NAME]?.content
  if (!content) throw new Error('File not found in gist')
  return JSON.parse(content)
}
```

### 2. Create `src/components/SyncSettings.vue`

A small form where the user enters their GitHub PAT and optionally a gist ID (for linking to an existing gist):

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const TOKEN_KEY = 'github-pat'
const GIST_ID_KEY = 'github-gist-id'

const token = ref('')
const gistId = ref('')

onMounted(() => {
  token.value = localStorage.getItem(TOKEN_KEY) ?? ''
  gistId.value = localStorage.getItem(GIST_ID_KEY) ?? ''
})

function save() {
  localStorage.setItem(TOKEN_KEY, token.value.trim())
  if (gistId.value.trim()) {
    localStorage.setItem(GIST_ID_KEY, gistId.value.trim())
  }
}
</script>

<template>
  <div class="sync-settings">
    <label>GitHub PAT <input v-model="token" type="password" /></label>
    <label>Gist ID (optional) <input v-model="gistId" type="text" /></label>
    <button @click="save">Save</button>
  </div>
</template>
```

### 3. Add sync actions to the Pinia store

In `src/stores/investments.ts`:

```ts
import { pushData, pullData } from '@/services/github-gist'

async function pushToRemote() {
  await pushData(institutions.value)
}

async function pullFromRemote() {
  const data = await pullData() as InstitutionData[]
  institutions.value = data
  selectedInstitutions.value = new Set(data.map((d) => d.institution))
  saveData()
}
```

### 4. Create `src/components/SyncControls.vue`

Push and Pull buttons, plus a link to open sync settings:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useInvestmentsStore } from '@/stores/investments'

const store = useInvestmentsStore()
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
    <button :disabled="syncing" @click="handlePush">Push</button>
    <button :disabled="syncing" @click="handlePull">Pull</button>
    <span v-if="status">{{ status }}</span>
  </div>
</template>
```

### 5. Add components to DashboardView

Place `SyncControls` in the header row of `src/views/DashboardView.vue`. Add a settings icon/button that toggles `SyncSettings` visibility.

## How Push and Pull Work

### Push

1. User clicks "Push".
2. The app reads the PAT from localStorage. If missing, prompt user to configure it.
3. Serialize `institutions.value` to JSON.
4. If a gist ID is stored, send a `PATCH` to `https://api.github.com/gists/{id}` with the updated file content.
5. If no gist ID exists, send a `POST` to `https://api.github.com/gists` to create a new secret gist, then store the returned gist ID in localStorage.
6. Display success or error.

### Pull

1. User clicks "Pull".
2. The app reads the PAT and gist ID from localStorage. If either is missing, show an error.
3. Send a `GET` to `https://api.github.com/gists/{id}`.
4. Extract the `investments.json` file content from the response.
5. Parse the JSON, validate the shape, and replace `institutions.value`.
6. Call `saveData()` to persist to localStorage.
7. Display success or error.

## Security Considerations

- **PAT storage**: The PAT is stored in localStorage, which is accessible to any JavaScript running on the same origin. This is acceptable for a personal-use SPA but would be a concern if the app is hosted on a shared domain or is vulnerable to XSS.
- **PAT scope**: The `gist` scope on a classic PAT grants read/write access to all of the user's gists. Recommend using a fine-grained PAT scoped to gist operations only.
- **Secret gist visibility**: Secret gists are not listed publicly and are not indexed by search engines, but anyone with the direct URL can view them. Do not treat this as encryption -- the data is obfuscated by obscurity only.
- **HTTPS only**: All GitHub API calls use HTTPS. No sensitive data is transmitted in the clear.
- **Input validation**: Always validate the shape and types of data pulled from the gist before replacing local state.
- **Token rotation**: Recommend the user set an expiration on the PAT and rotate it periodically.
- **No CORS issues**: GitHub API supports CORS for browser requests from any origin.
- **Rate limiting**: Authenticated requests have a 5,000 requests/hour limit, which is more than sufficient for manual push/pull operations.
