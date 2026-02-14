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
  <header class="header">
    <div class="header-text">
      <h1 class="title">Investment Tracker</h1>
      <p class="subtitle">
        {{ selectedCount }} of {{ totalCount }} institutions selected
      </p>
    </div>
    <div class="total-card">
      <span class="total-label">Portfolio Total</span>
      <span class="total-value">{{ formatCurrency(latestTotal) }}</span>
    </div>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.025em;
}

.subtitle {
  margin: 0.25rem 0 0;
  color: #64748b;
  font-size: 0.875rem;
}

.total-card {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: #fff;
  padding: 0.75rem 1.25rem;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.total-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.85;
}

.total-value {
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}
</style>
