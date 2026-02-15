import { ref, onMounted, onUnmounted } from 'vue'
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth'
import type { User, Unsubscribe } from 'firebase/auth'
import { auth, googleProvider } from '@/services/firebase'

const user = ref<User | null>(null)

export function useAuth() {
  let unsubscribe: Unsubscribe | null = null

  onMounted(() => {
    unsubscribe = onAuthStateChanged(auth, (u) => {
      user.value = u
    })
  })

  onUnmounted(() => {
    unsubscribe?.()
  })

  async function signIn() {
    await signInWithPopup(auth, googleProvider)
  }

  async function signOut() {
    await firebaseSignOut(auth)
  }

  return { user, signIn, signOut }
}
