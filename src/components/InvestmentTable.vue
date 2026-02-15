<script setup lang="ts">
import { computed, ref } from 'vue'
import { useInvestmentsStore } from '@/stores/investments'
import AddEntryModal from '@/components/AddEntryModal.vue'

const store = useInvestmentsStore()

const showAddModal = ref(false)
const editDate = ref<string>()

function openEdit(date: string) {
  editDate.value = date
  showAddModal.value = true
}

function closeModal() {
  showAddModal.value = false
  editDate.value = undefined
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

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function performance(row: { dateMap: Map<string, { amount_before_investment: number; amount_after_investment: number }> }, dateIndex: number): number | null {
  const d = dates.value[dateIndex]
  const prev = dateIndex > 0 ? dates.value[dateIndex - 1] : undefined
  if (!d) return null
  const cur = row.dateMap.get(d)
  const prevRec = prev ? row.dateMap.get(prev) : undefined
  if (!cur || !prevRec || prevRec.amount_after_investment === 0) return null
  return ((cur.amount_before_investment - prevRec.amount_after_investment) / prevRec.amount_after_investment) * 100
}

function performanceValue(row: { dateMap: Map<string, { amount_before_investment: number; amount_after_investment: number }> }, dateIndex: number): number | null {
  const d = dates.value[dateIndex]
  const prev = dateIndex > 0 ? dates.value[dateIndex - 1] : undefined
  if (!d) return null
  const cur = row.dateMap.get(d)
  const prevRec = prev ? row.dateMap.get(prev) : undefined
  if (!cur || !prevRec) return null
  return cur.amount_before_investment - prevRec.amount_after_investment
}

function formatPercent(value: number): string {
  return value.toFixed(2) + '%'
}

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

function totalPerfPercent(di: number): number | null {
  if (di === 0) return null
  const prevAfter = totals.value[di - 1]?.after
  const curBefore = totals.value[di]?.before
  if (prevAfter == null || curBefore == null || prevAfter === 0) return null
  return ((curBefore - prevAfter) / prevAfter) * 100
}

function totalPerfValue(di: number): number | null {
  if (di === 0) return null
  const prevAfter = totals.value[di - 1]?.after
  const curBefore = totals.value[di]?.before
  if (prevAfter == null || curBefore == null) return null
  return curBefore - prevAfter
}

function deleteDate(date: string) {
  if (confirm(`Delete entry for ${formatDate(date)}?`)) {
    store.removeRecordsByDate(date)
  }
}

function colorClass(value: number | null): string {
  if (value === null) return 'muted'
  if (value > 0) return 'positive'
  if (value < 0) return 'negative'
  return ''
}

function exportCsv() {
  const cols = dates.value
  const header = ['Institution', ...cols.flatMap((d) => [`${formatDate(d)} Before`, `${formatDate(d)} After`])]
  const rows: string[][] = [header]

  for (const row of institutionRows.value) {
    const values = cols.flatMap((d) => {
      const rec = row.dateMap.get(d)
      return rec ? [String(rec.amount_before_investment), String(rec.amount_after_investment)] : ['', '']
    })
    rows.push([row.name, ...values])

    const addedValues = cols.flatMap((d) => {
      const rec = row.dateMap.get(d)
      return rec ? [String(rec.amount_after_investment - rec.amount_before_investment), ''] : ['', '']
    })
    rows.push([`${row.name} - added value`, ...addedValues])

    const perfValues = cols.flatMap((_, di) => {
      const p = performance(row, di)
      return p !== null ? [formatPercent(p), ''] : ['', '']
    })
    rows.push([`${row.name} - performance %`, ...perfValues])

    const perfValValues = cols.flatMap((_, di) => {
      const p = performanceValue(row, di)
      return p !== null ? [String(p), ''] : ['', '']
    })
    rows.push([`${row.name} - performance value`, ...perfValValues])
  }

  const totalValues = totals.value.flatMap((t) => [String(t.before), String(t.after)])
  rows.push(['Total', ...totalValues])

  const totalAdded = totals.value.flatMap((t) => [String(t.after - t.before), ''])
  rows.push(['Total - added value', ...totalAdded])

  const totalPerf = cols.flatMap((_, di) => {
    const p = totalPerfPercent(di)
    return p !== null ? [formatPercent(p), ''] : ['', '']
  })
  rows.push(['Total - performance %', ...totalPerf])

  const totalPerfVal = cols.flatMap((_, di) => {
    const p = totalPerfValue(di)
    return p !== null ? [String(p), ''] : ['', '']
  })
  rows.push(['Total - performance value', ...totalPerfVal])

  const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'investments.csv'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="table-wrapper">
    <div class="table-header">
      <h2 class="table-title">Investment Details</h2>
      <div class="header-buttons">
        <button class="btn-export" @click="showAddModal = true">+ Add Entry</button>
        <button v-if="institutionRows.length > 0" class="btn-export" @click="exportCsv">
          Export to CSV
        </button>
      </div>
    </div>
    <div class="table-scroll">
      <table v-if="institutionRows.length > 0" class="table">
        <thead>
          <tr>
            <th class="sticky-col header-col" rowspan="2">Institution</th>
            <th v-for="d in dates" :key="d" colspan="2" class="date-header">
              <span class="date-header-content">
                {{ formatDate(d) }}
                <button class="btn-action" @click="openEdit(d)" title="Edit entry">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button class="btn-action btn-action-danger" @click="deleteDate(d)" title="Delete entry">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
              </span>
            </th>
          </tr>
          <tr class="sub-header">
            <template v-for="d in dates" :key="d + '-sub'">
              <th class="sub-header-cell">Before</th>
              <th class="sub-header-cell">After</th>
            </template>
          </tr>
        </thead>
        <tbody>
          <template v-for="(row, idx) in institutionRows" :key="row.name">
            <tr :class="{ 'row-alt': idx % 2 === 0 }">
              <td class="sticky-col name-cell" :class="{ 'row-alt': idx % 2 === 0 }">
                {{ row.name }}
              </td>
              <template v-for="d in dates" :key="d">
                <td class="value-cell">
                  <template v-if="row.dateMap.has(d)">
                    {{ formatCurrency(row.dateMap.get(d)!.amount_before_investment) }}
                  </template>
                  <span v-else class="muted">&mdash;</span>
                </td>
                <td class="value-cell">
                  <template v-if="row.dateMap.has(d)">
                    {{ formatCurrency(row.dateMap.get(d)!.amount_after_investment) }}
                  </template>
                  <span v-else class="muted">&mdash;</span>
                </td>
              </template>
            </tr>
            <tr :class="{ 'row-alt': idx % 2 === 0 }">
              <td class="sticky-col perf-label" :class="{ 'row-alt': idx % 2 === 0 }">
                {{ row.name }} - added value</td>
              <template v-for="d in dates" :key="d + '-added'">
                <td colspan="2" class="perf-cell" :class="row.dateMap.has(d) ? colorClass(row.dateMap.get(d)!.amount_after_investment - row.dateMap.get(d)!.amount_before_investment) : ''">
                  <template v-if="row.dateMap.has(d)">
                    {{ formatCurrency(row.dateMap.get(d)!.amount_after_investment - row.dateMap.get(d)!.amount_before_investment) }}
                  </template>
                  <span v-else>&mdash;</span>
                </td>
              </template>
            </tr>
            <tr :class="{ 'row-alt': idx % 2 === 0 }">
              <td class="sticky-col perf-label" :class="{ 'row-alt': idx % 2 === 0 }">
                {{ row.name }} - performance %
              </td>
              <template v-for="(d, di) in dates" :key="d + '-perf'">
                <td colspan="2" class="perf-cell" :class="colorClass(performance(row, di))">
                  <template v-if="performance(row, di) !== null">
                    {{ performance(row, di)! > 0 ? '+' : '' }}{{ formatPercent(performance(row, di)!) }}
                  </template>
                  <span v-else>&mdash;</span>
                </td>
              </template>
            </tr>
            <tr class="group-last" :class="{ 'row-alt': idx % 2 === 0 }">
              <td class="sticky-col perf-label" :class="{ 'row-alt': idx % 2 === 0 }">
                {{ row.name }} - performance value
              </td>
              <template v-for="(d, di) in dates" :key="d + '-perfval'">
                <td colspan="2" class="perf-cell" :class="colorClass(performanceValue(row, di))">
                  <template v-if="performanceValue(row, di) !== null">
                    {{ performanceValue(row, di)! > 0 ? '+' : '' }}{{ formatCurrency(performanceValue(row, di)!) }}
                  </template>
                  <span v-else>&mdash;</span>
                </td>
              </template>
            </tr>
          </template>
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td class="sticky-col total-label">Total</td>
            <template v-for="(t, di) in totals" :key="'total-' + di">
              <td class="total-cell">{{ formatCurrency(t.before) }}</td>
              <td class="total-cell">{{ formatCurrency(t.after) }}</td>
            </template>
          </tr>
          <tr class="total-row">
            <td class="sticky-col total-perf-label">Total - added value</td>
            <template v-for="(t, di) in totals" :key="'total-added-' + di">
              <td colspan="2" class="total-perf-cell" :class="colorClass(t.after - t.before)">
                {{ formatCurrency(t.after - t.before) }}
              </td>
            </template>
          </tr>
          <tr class="total-row">
            <td class="sticky-col total-perf-label">Total - performance %</td>
            <template v-for="(d, di) in dates" :key="d + '-total-perf'">
              <td colspan="2" class="total-perf-cell" :class="colorClass(totalPerfPercent(di))">
                <template v-if="totalPerfPercent(di) !== null">
                  {{ totalPerfPercent(di)! > 0 ? '+' : '' }}{{ formatPercent(totalPerfPercent(di)!) }}
                </template>
                <span v-else>&mdash;</span>
              </td>
            </template>
          </tr>
          <tr class="total-row total-last">
            <td class="sticky-col total-perf-label">Total - performance value</td>
            <template v-for="(d, di) in dates" :key="d + '-total-perfval'">
              <td colspan="2" class="total-perf-cell" :class="colorClass(totalPerfValue(di))">
                <template v-if="totalPerfValue(di) !== null">
                  {{ totalPerfValue(di)! > 0 ? '+' : '' }}{{ formatCurrency(totalPerfValue(di)!) }}
                </template>
                <span v-else>&mdash;</span>
              </td>
            </template>
          </tr>
        </tfoot>
      </table>
    </div>
    <p v-if="institutionRows.length === 0" class="empty">No data to display.</p>
    <AddEntryModal v-if="showAddModal" :edit-date="editDate" @close="closeModal" />
  </div>
</template>

<style scoped>
.table-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.table-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: #0f172a;
}

.header-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-export {
  padding: 0.35rem 0.85rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  background: #fff;
  color: #475569;
  white-space: nowrap;
}

.btn-export:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.table-scroll {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.table {
  border-collapse: collapse;
  font-size: 0.8125rem;
  text-align: right;
  white-space: nowrap;
  width: 100%;
}

/* Header */
.header-col {
  text-align: left;
  padding: 0.625rem 0.75rem;
  background: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
  font-weight: 600;
  color: #334155;
}

.date-header {
  padding: 0.5rem 0.5rem;
  text-align: center;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  font-weight: 600;
  color: #334155;
}

.sub-header {
  border-bottom: 2px solid #e2e8f0;
}

.sub-header-cell {
  padding: 0.3rem 0.5rem;
  font-weight: 500;
  color: #94a3b8;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  background: #f8fafc;
}

/* Sticky column */
.sticky-col {
  position: sticky;
  left: 0;
  z-index: 1;
  background: #fff;
}

/* Body rows */
.row-alt {
  background-color: #f8fafc;
}

.name-cell {
  text-align: left;
  padding: 0.5rem 0.75rem;
  font-weight: 600;
  color: #1e293b;
}

.value-cell {
  padding: 0.375rem 0.5rem;
  color: #334155;
}

.perf-label {
  text-align: left;
  padding: 0.25rem 0.75rem;
  font-style: italic;
  color: #94a3b8;
  font-size: 0.75rem;
}

.perf-cell {
  padding: 0.25rem 0.5rem;
  text-align: center;
  font-size: 0.75rem;
}

.group-last {
  border-bottom: 1px solid #e2e8f0;
}

/* Footer */
.total-row {
  border-top: 2px solid #e2e8f0;
}

.total-row:first-child {
  border-top: 3px solid #cbd5e1;
}

.total-last {
  border-bottom: none;
}

.total-label {
  text-align: left;
  padding: 0.625rem 0.75rem;
  font-weight: 700;
  color: #0f172a;
  background: #f8fafc;
}

.total-cell {
  padding: 0.375rem 0.5rem;
  font-weight: 600;
  color: #1e293b;
  background: #f8fafc;
}

.total-perf-label {
  text-align: left;
  padding: 0.375rem 0.75rem;
  font-weight: 600;
  font-style: italic;
  color: #64748b;
  font-size: 0.75rem;
  background: #f8fafc;
}

.total-perf-cell {
  padding: 0.375rem 0.5rem;
  text-align: center;
  font-weight: 600;
  font-size: 0.75rem;
  background: #f8fafc;
}

/* Color classes */
.positive {
  color: #3b82f6;
}

.negative {
  color: #dc2626;
}

.muted {
  color: #d1d5db;
}

.empty {
  color: #94a3b8;
  text-align: center;
  padding: 2rem 0;
  margin: 0;
}

.date-header-content {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.btn-action {
  border: none;
  background: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 2px;
  display: inline-flex;
  align-items: center;
  border-radius: 4px;
}

.btn-action:hover {
  color: #3b82f6;
  background: #eff6ff;
}

.btn-action-danger:hover {
  color: #dc2626;
  background: #fee2e2;
}
</style>
