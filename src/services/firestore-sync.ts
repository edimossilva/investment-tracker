import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
import type { InstitutionData } from '@/types/investment'

function getUserDocRef() {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')
  return doc(db, 'users', user.uid, 'data', 'investments')
}

export async function pushData(data: InstitutionData[]): Promise<void> {
  const ref = getUserDocRef()
  await setDoc(ref, { institutions: data })
}

export async function pullData(): Promise<InstitutionData[]> {
  const ref = getUserDocRef()
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('No remote data found')
  return snap.data().institutions as InstitutionData[]
}
