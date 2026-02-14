import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { InstitutionData } from '@/types/investment'
import rawData from '../../investments.json'

const data = rawData as InstitutionData[]

export const useInvestmentsStore = defineStore('investments', () => {
  const institutions = ref<InstitutionData[]>(data)
  const selectedInstitutions = ref<Set<string>>(new Set(data.map((d) => d.institution)))

  const institutionNames = computed(() => institutions.value.map((d) => d.institution))

  const filteredInstitutions = computed(() =>
    institutions.value.filter((d) => selectedInstitutions.value.has(d.institution)),
  )

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

  return {
    institutions,
    selectedInstitutions,
    institutionNames,
    filteredInstitutions,
    toggleInstitution,
    selectAll,
    selectNone,
  }
})
