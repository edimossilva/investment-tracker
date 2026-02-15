<script setup lang="ts">
import { computed } from 'vue'
import { useInvestmentsStore, type Period } from '@/stores/investments'

const store = useInvestmentsStore()

const periodLabels: Record<Period, string> = {
  'past-3-months': 'Past 3 months',
  'past-6-months': 'Past 6 months',
  'past-12-months': 'Past 12 months',
  'full-time': 'Full time',
}

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
    return { name: inst.institution, dateMap }
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

const lastValueAdded = computed(() => {
  const t = totals.value
  if (t.length === 0) return null
  const last = t[t.length - 1]!
  return last.after - last.before
})

const initialAddition = computed(() => {
  const t = totals.value
  if (t.length === 0) return null
  return t[0]!.before
})

const lastPerfPercent = computed(() => {
  const t = totals.value
  if (t.length < 2) return null
  const prevAfter = t[t.length - 2]!.after
  const curBefore = t[t.length - 1]!.before
  if (prevAfter === 0) return null
  return ((curBefore - prevAfter) / prevAfter) * 100
})

const lastPerfValue = computed(() => {
  const t = totals.value
  if (t.length < 2) return null
  return t[t.length - 1]!.before - t[t.length - 2]!.after
})

const avgValueAdded = computed(() => {
  const t = totals.value
  if (t.length === 0) return null
  const sum = t.reduce((acc, v) => acc + (v.after - v.before), 0)
  return sum / t.length
})

const totalValueAdded = computed(() => {
  const t = totals.value
  if (t.length === 0) return null
  return t.reduce((acc, v) => acc + (v.after - v.before), 0)
})

const totalPerfValue = computed(() => {
  const t = totals.value
  if (t.length < 2) return null
  let sum = 0
  for (let i = 1; i < t.length; i++) {
    sum += t[i]!.before - t[i - 1]!.after
  }
  return sum
})

const avgPerfPercent = computed(() => {
  const t = totals.value
  if (t.length < 2) return null
  let sum = 0
  let count = 0
  for (let i = 1; i < t.length; i++) {
    const prevAfter = t[i - 1]!.after
    const curBefore = t[i]!.before
    if (prevAfter === 0) continue
    sum += ((curBefore - prevAfter) / prevAfter) * 100
    count++
  }
  if (count === 0) return null
  return sum / count
})

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatPercent(value: number): string {
  return (value > 0 ? '+' : '') + value.toFixed(2) + '%'
}

function formatCurrencySigned(value: number): string {
  return (value > 0 ? '+' : '') + formatCurrency(value)
}

function colorClass(value: number | null): string {
  if (value === null) return ''
  if (value > 0) return 'positive'
  if (value < 0) return 'negative'
  return ''
}

interface Metric {
  label: string
  value: number | null
  format: 'currency' | 'percent'
}

const valueAddedMetrics = computed<Metric[]>(() => [
  { label: 'Initial Addition', value: initialAddition.value, format: 'currency' },
  { label: 'Value Added (Last Month)', value: lastValueAdded.value, format: 'currency' },
  { label: 'Avg Value Added', value: avgValueAdded.value, format: 'currency' },
  { label: 'Total Value Added', value: totalValueAdded.value, format: 'currency' },
])

const performanceMetrics = computed<Metric[]>(() => [
  { label: 'Performance % (Last Month)', value: lastPerfPercent.value, format: 'percent' },
  { label: 'Performance Value (Last Month)', value: lastPerfValue.value, format: 'currency' },
  { label: 'Total Performance Value', value: totalPerfValue.value, format: 'currency' },
  { label: 'Avg Performance %', value: avgPerfPercent.value, format: 'percent' },
])
</script>

<template>
  <div class="summary-wrapper">
    <div class="summary-card">
      <div class="card-header">
        <h4 class="card-title">Value Added</h4>
        <span class="period-badge">{{ periodLabels[store.selectedPeriod] }}</span>
      </div>
      <div class="metric-list">
        <div v-for="m in valueAddedMetrics" :key="m.label" class="metric-row">
          <span class="metric-label">{{ m.label }}</span>
          <span
            v-if="m.value !== null"
            class="metric-value"
            :class="colorClass(m.value)"
          >
            {{ m.format === 'currency' ? formatCurrencySigned(m.value) : formatPercent(m.value) }}
          </span>
          <span v-else class="metric-value muted">&mdash;</span>
        </div>
      </div>
    </div>
    <div class="summary-card">
      <div class="card-header">
        <h4 class="card-title">Performance</h4>
        <span class="period-badge">{{ periodLabels[store.selectedPeriod] }}</span>
      </div>
      <div class="metric-list">
        <div v-for="m in performanceMetrics" :key="m.label" class="metric-row">
          <span class="metric-label">{{ m.label }}</span>
          <span
            v-if="m.value !== null"
            class="metric-value"
            :class="colorClass(m.value)"
          >
            {{ m.format === 'currency' ? formatCurrencySigned(m.value) : formatPercent(m.value) }}
          </span>
          <span v-else class="metric-value muted">&mdash;</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.summary-wrapper {
  display: contents;
}

.summary-card {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06);
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.card-title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
}

.period-badge {
  font-size: 0.75rem;
  font-weight: 500;
  color: #3b82f6;
  background: #eff6ff;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  white-space: nowrap;
}

.metric-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.metric-row {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.metric-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
}

.metric-value {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}

.positive {
  color: #3b82f6;
}

.negative {
  color: #dc2626;
}

.muted {
  color: #d1d5db;
}
</style>
