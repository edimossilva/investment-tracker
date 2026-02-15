import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { InstitutionData } from '@/types/investment'
import { pushData, pullData } from '@/services/firestore-sync'
import rawData from '../../investments.json'

const STORAGE_KEY = 'investments-data'

function loadData(): InstitutionData[] {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) return JSON.parse(stored) as InstitutionData[]
  return rawData as InstitutionData[]
}

const data = loadData()

export type Period = 'full-time' | 'past-3-months' | 'past-6-months' | 'past-12-months'

export const useInvestmentsStore = defineStore('investments', () => {
  const institutions = ref<InstitutionData[]>(data)
  const selectedInstitutions = ref<Set<string>>(new Set(data.map((d) => d.institution)))
  const selectedPeriod = ref<Period>('past-3-months')

  const institutionNames = computed(() => institutions.value.map((d) => d.institution))

  const periodMonths: Record<Period, number | null> = {
    'full-time': null,
    'past-3-months': 3,
    'past-6-months': 6,
    'past-12-months': 12,
  }

  const periodCutoff = computed(() => {
    const months = periodMonths[selectedPeriod.value]
    if (months === null) return null
    const now = new Date()
    now.setMonth(now.getMonth() - months)
    return now.toISOString().slice(0, 10)
  })

  const filteredInstitutions = computed(() => {
    const cutoff = periodCutoff.value
    return institutions.value
      .filter((d) => selectedInstitutions.value.has(d.institution))
      .map((d) => {
        if (!cutoff) return d
        return {
          ...d,
          investments: d.investments.filter((r) => r.date >= cutoff),
        }
      })
  })

  function toggleInstitution(name: string) {
    if (selectedInstitutions.value.has(name)) {
      selectedInstitutions.value.delete(name)
    } else {
      selectedInstitutions.value.add(name)
    }
    // Trigger reactivity
    selectedInstitutions.value = new Set(selectedInstitutions.value)
  }

  function selectAll() {
    selectedInstitutions.value = new Set(institutionNames.value)
  }

  function selectNone() {
    selectedInstitutions.value = new Set()
  }

  function setPeriod(period: Period) {
    selectedPeriod.value = period
  }

  function addRecords(date: string, records: Map<string, { before: number; after: number }>) {
    for (const inst of institutions.value) {
      const entry = records.get(inst.institution)
      if (!entry) continue
      const last = inst.investments[inst.investments.length - 1]
      const lastAfter = last?.amount_after_investment || 0
      const before = entry.before || lastAfter
      const after = entry.after || lastAfter
      const newRecord = {
        date,
        amount_before_investment: before,
        amount_after_investment: after,
      }
      const idx = inst.investments.findIndex((r) => r.date >= date)
      if (idx === -1) {
        inst.investments.push(newRecord)
      } else if (inst.investments[idx]!.date === date) {
        inst.investments[idx] = newRecord
      } else {
        inst.investments.splice(idx, 0, newRecord)
      }
    }
    // Trigger reactivity
    institutions.value = [...institutions.value]
  }

  function removeRecordsByDate(date: string) {
    for (const inst of institutions.value) {
      inst.investments = inst.investments.filter((r) => r.date !== date)
    }
    institutions.value = [...institutions.value]
    saveData()
  }

  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(institutions.value))
  }

  async function pushToRemote() {
    await pushData(institutions.value)
  }

  async function pullFromRemote() {
    const data = await pullData()
    institutions.value = data
    selectedInstitutions.value = new Set(data.map((d) => d.institution))
    saveData()
  }

  return {
    institutions,
    selectedInstitutions,
    selectedPeriod,
    institutionNames,
    filteredInstitutions,
    toggleInstitution,
    selectAll,
    selectNone,
    setPeriod,
    addRecords,
    removeRecordsByDate,
    saveData,
    pushToRemote,
    pullFromRemote,
  }
})
