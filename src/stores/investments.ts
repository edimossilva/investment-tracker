import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { InstitutionData } from '@/types/investment'
import rawData from '../../investments.json'

const data = rawData as InstitutionData[]

export type Period = 'full-time' | 'past-12-months'

export const useInvestmentsStore = defineStore('investments', () => {
  const institutions = ref<InstitutionData[]>(data)
  const selectedInstitutions = ref<Set<string>>(new Set(data.map((d) => d.institution)))
  const selectedPeriod = ref<Period>('full-time')

  const institutionNames = computed(() => institutions.value.map((d) => d.institution))

  const periodCutoff = computed(() => {
    if (selectedPeriod.value === 'full-time') return null
    const now = new Date()
    now.setMonth(now.getMonth() - 12)
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
  }
})
