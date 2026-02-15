<script setup lang="ts">
import { computed } from 'vue'
import { useInvestmentsStore } from '@/stores/investments'

const store = useInvestmentsStore()

const dates = computed(() => {
  const dateSet = new Set<string>()
  for (const inst of store.filteredInstitutions) {
    for (const rec of inst.investments) {
      dateSet.add(rec.date)
    }
  }
  return Array.from(dateSet).sort()
})

const institutionRows = computed(() =>
  store.filteredInstitutions.map((inst) => {
    const dateMap = new Map(inst.investments.map((r) => [r.date, r]))
    return { dateMap }
  }),
)

const totals = computed(() =>
  dates.value.map((d) => {
    let before = 0
    let after = 0
    for (const row of institutionRows.value) {
      const rec = row.dateMap.get(d)
      if (rec) {
        before += rec.amount_before_investment
        after += rec.amount_after_investment
      }
    }
    return { before, after }
  }),
)

const initialAddition = computed(() => {
  const t = totals.value
  if (t.length === 0) return 0
  return t[0]!.before
})

const totalValueAdded = computed(() => {
  const t = totals.value
  if (t.length === 0) return 0
  return t.reduce((acc, v) => acc + (v.after - v.before), 0)
})

const totalPerfValue = computed(() => {
  const t = totals.value
  if (t.length < 2) return 0
  let sum = 0
  for (let i = 1; i < t.length; i++) {
    sum += t[i]!.before - t[i - 1]!.after
  }
  return sum
})

const portfolioTotal = computed(() =>
  initialAddition.value + totalValueAdded.value + totalPerfValue.value,
)

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
</script>

<template>
  <header class="header">
    <div class="total-card">
      <span class="total-title">Investments Summary</span>
      <div class="total-formula">
        <div class="formula-col">
          <span class="formula-label">Initial Addition</span>
          <span class="formula-value">{{ formatCurrency(initialAddition) }}</span>
        </div>
        <span class="formula-op">+</span>
        <div class="formula-col">
          <span class="formula-label">Total Value Added</span>
          <span class="formula-value">{{ formatCurrency(totalValueAdded) }}</span>
        </div>
        <span class="formula-op">+</span>
        <div class="formula-col">
          <span class="formula-label">Total Performance Value</span>
          <span class="formula-value">{{ formatCurrency(totalPerfValue) }}</span>
        </div>
        <span class="formula-op">=</span>
        <div class="formula-col">
          <span class="formula-label formula-label-bold">Total</span>
          <span class="formula-value">{{ formatCurrency(portfolioTotal) }}</span>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  justify-content: center;
}

.total-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: #fff;
  padding: 0.75rem 2rem;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.total-formula {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.formula-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
}

.formula-label {
  font-size: 0.7rem;
  opacity: 0.85;
  letter-spacing: 0.01em;
}

.formula-label-bold {
  font-weight: 700;
}

.formula-value {
  font-size: 1.1rem;
  font-weight: 700;
}

.total-title {
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  opacity: 0.9;
}

.formula-op {
  font-size: 1.1rem;
  opacity: 0.75;
  font-weight: 600;
}
</style>
