<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useInvestmentsStore } from '@/stores/investments'

const { user, signIn, signOut } = useAuth()
const store = useInvestmentsStore()

const loading = ref(false)
const status = ref('')

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
      <span class="user-name">{{ user.displayName }}</span>
      <button class="btn-sync btn-push" :disabled="loading" @click="handlePush">Push</button>
      <button class="btn-sync btn-pull" :disabled="loading" @click="handlePull">Pull</button>
      <button class="btn-sync btn-sign-out" :disabled="loading" @click="handleSignOut">
        Sign Out
      </button>
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

.user-name {
  font-size: 0.8rem;
  color: #64748b;
  margin-right: 0.25rem;
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

.btn-push {
  background: linear-gradient(135deg, #10b981, #059669);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.btn-push:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.btn-pull {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
}

.btn-pull:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}

.btn-sign-out {
  background: #64748b;
  box-shadow: 0 2px 8px rgba(100, 116, 139, 0.3);
}

.btn-sign-out:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(100, 116, 139, 0.4);
}

.sync-status {
  font-size: 0.75rem;
  color: #64748b;
  font-style: italic;
}
</style>
