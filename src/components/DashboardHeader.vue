<script setup lang="ts">
import { computed } from 'vue'
import { useInvestmentsStore } from '@/stores/investments'

const store = useInvestmentsStore()

const selectedCount = computed(() => store.selectedInstitutions.size)
const totalCount = computed(() => store.institutionNames.length)

const latestTotal = computed(() => {
  let total = 0
  for (const inst of store.filteredInstitutions) {
    const last = inst.investments[inst.investments.length - 1]
    if (last) {
      total += last.amount_after_investment
    }
  }
  return total
})

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
</script>

<template>
  <header style="margin-bottom: 1.5rem">
    <h1 style="margin: 0 0 0.5rem 0; font-size: 1.5rem">Investment Tracker</h1>
    <p style="margin: 0; color: #6b7280">
      {{ selectedCount }} of {{ totalCount }} institutions selected &mdash; Latest total:
      <strong>{{ formatCurrency(latestTotal) }}</strong>
    </p>
  </header>
</template>
