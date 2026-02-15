<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useInvestmentsStore } from '@/stores/investments'

const { user, signIn, signOut } = useAuth()
const store = useInvestmentsStore()

const loading = ref(false)
const status = ref('')
const menuOpen = ref(false)

async function handlePush() {
  loading.value = true
  status.value = ''
  try {
    await store.pushToRemote()
    status.value = 'Pushed!'
  } catch (e: unknown) {
    status.value = e instanceof Error ? e.message : 'Push failed'
  } finally {
    loading.value = false
    setTimeout(() => (status.value = ''), 3000)
  }
}

async function handlePull() {
  loading.value = true
  status.value = ''
  try {
    await store.pullFromRemote()
    status.value = 'Pulled!'
  } catch (e: unknown) {
    status.value = e instanceof Error ? e.message : 'Pull failed'
  } finally {
    loading.value = false
    setTimeout(() => (status.value = ''), 3000)
  }
}

async function handleSignIn() {
  loading.value = true
  try {
    await signIn()
  } catch {
    status.value = 'Sign-in failed'
    setTimeout(() => (status.value = ''), 3000)
  } finally {
    loading.value = false
  }
}

async function handleSignOut() {
  await signOut()
  status.value = ''
}
</script>

<template>
  <div class="sync-controls">
    <template v-if="!user">
      <button class="btn-sync btn-sign-in" :disabled="loading" @click="handleSignIn">
        Sign in with Google
      </button>
    </template>
    <template v-else>
      <div class="gear-wrapper">
        <button class="btn-gear" @click="menuOpen = !menuOpen">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path
              d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65
                1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65
                0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65
                1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0
                0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65
                1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0
                0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65
                1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0
                0 0-1.51 1z"
            />
          </svg>
        </button>
        <div v-if="menuOpen" class="dropdown-overlay" @click="menuOpen = false" />
        <div v-if="menuOpen" class="dropdown">
          <span class="dropdown-user">{{ user.displayName }}</span>
          <button class="dropdown-item" :disabled="loading" @click="handlePush(); menuOpen = false">
            Push
          </button>
          <button class="dropdown-item" :disabled="loading" @click="handlePull(); menuOpen = false">
            Pull
          </button>
          <button
            class="dropdown-item dropdown-item-danger"
            :disabled="loading"
            @click="handleSignOut(); menuOpen = false"
          >
            Sign Out
          </button>
        </div>
      </div>
    </template>
    <span v-if="status" class="sync-status">{{ status }}</span>
  </div>
</template>

<style scoped>
.sync-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-sync {
  padding: 0.35rem 0.85rem;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  color: #fff;
  transition: box-shadow 0.15s;
}

.btn-sync:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-sign-in {
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.btn-sign-in:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.gear-wrapper {
  position: relative;
}

.btn-gear {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
}

.btn-gear:hover {
  color: #475569;
  background: #f1f5f9;
}

.dropdown-overlay {
  position: fixed;
  inset: 0;
  z-index: 49;
}

.dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  min-width: 120px;
  z-index: 50;
  padding: 4px;
}

.dropdown-user {
  display: block;
  padding: 0.4rem 0.75rem;
  font-size: 0.75rem;
  color: #94a3b8;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 2px;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 0.4rem 0.75rem;
  border: none;
  background: none;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #334155;
  cursor: pointer;
  text-align: left;
  border-radius: 4px;
}

.dropdown-item:hover:not(:disabled) {
  background: #f1f5f9;
}

.dropdown-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dropdown-item-danger {
  color: #dc2626;
}

.dropdown-item-danger:hover:not(:disabled) {
  background: #fef2f2;
}

.sync-status {
  font-size: 0.75rem;
  color: #64748b;
  font-style: italic;
}
</style>
