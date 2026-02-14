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
    return { name: inst.institution, dateMap }
  }),
)

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(iso: string): string {
  const [y, m] = iso.split('-')
  return `${m}/${y}`
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
</script>

<template>
  <div style="margin-top: 2rem; overflow-x: auto">
    <h2 style="font-size: 1.125rem; margin: 0 0 0.75rem 0">Investment Details</h2>
    <table
      v-if="institutionRows.length > 0"
      style="border-collapse: collapse; font-size: 0.8125rem; text-align: right; white-space: nowrap"
    >
      <thead>
        <tr>
          <th
            rowspan="2"
            style="
              text-align: left;
              padding: 0.375rem 0.75rem;
              position: sticky;
              left: 0;
              background: #fff;
              z-index: 1;
              border-bottom: 2px solid #e5e7eb;
            "
          >
            Institution
          </th>
          <th
            v-for="d in dates"
            :key="d"
            colspan="2"
            style="
              padding: 0.375rem 0.5rem;
              text-align: center;
              border-bottom: 1px solid #e5e7eb;
            "
          >
            {{ formatDate(d) }}
          </th>
        </tr>
        <tr style="border-bottom: 2px solid #e5e7eb">
          <template v-for="d in dates" :key="d + '-sub'">
            <th style="padding: 0.25rem 0.5rem; font-weight: 500; color: #6b7280">Before</th>
            <th style="padding: 0.25rem 0.5rem; font-weight: 500; color: #6b7280">After</th>
          </template>
        </tr>
      </thead>
      <tbody>
        <template v-for="(row, idx) in institutionRows" :key="row.name">
          <tr
            :style="{
              backgroundColor: idx % 2 === 0 ? '#f9fafb' : 'transparent',
            }"
          >
            <td
              style="
                text-align: left;
                padding: 0.375rem 0.75rem;
                font-weight: 600;
                position: sticky;
                left: 0;
                z-index: 1;
              "
              :style="{ backgroundColor: idx % 2 === 0 ? '#f9fafb' : '#fff' }"
            >
              {{ row.name }}
            </td>
            <template v-for="d in dates" :key="d">
              <td style="padding: 0.25rem 0.5rem; color: #374151">
                <template v-if="row.dateMap.has(d)">
                  {{ formatCurrency(row.dateMap.get(d)!.amount_before_investment) }}
                </template>
                <span v-else style="color: #d1d5db">&mdash;</span>
              </td>
              <td style="padding: 0.25rem 0.5rem; color: #374151">
                <template v-if="row.dateMap.has(d)">
                  {{ formatCurrency(row.dateMap.get(d)!.amount_after_investment) }}
                </template>
                <span v-else style="color: #d1d5db">&mdash;</span>
              </td>
            </template>
          </tr>
          <tr
            :style="{
              backgroundColor: idx % 2 === 0 ? '#f9fafb' : 'transparent',
              borderBottom: '1px solid #e5e7eb',
            }"
          >
            <td
              style="
                text-align: left;
                padding: 0.25rem 0.75rem;
                font-style: italic;
                color: #6b7280;
                position: sticky;
                left: 0;
                z-index: 1;
              "
              :style="{ backgroundColor: idx % 2 === 0 ? '#f9fafb' : '#fff' }"
            >
              {{ row.name }} - performance %
            </td>
            <template v-for="(d, di) in dates" :key="d + '-perf'">
              <td
                colspan="2"
                style="padding: 0.25rem 0.5rem; text-align: center"
                :style="{
                  color: performance(row, di) === null ? '#d1d5db'
                    : performance(row, di)! > 0 ? '#3b82f6'
                    : performance(row, di)! < 0 ? '#dc2626'
                    : '#374151',
                }"
              >
                <template v-if="performance(row, di) !== null">
                  {{ performance(row, di)! > 0 ? '+' : '' }}{{ formatPercent(performance(row, di)!) }}
                </template>
                <span v-else>&mdash;</span>
              </td>
            </template>
          </tr>
          <tr
            :style="{
              backgroundColor: idx % 2 === 0 ? '#f9fafb' : 'transparent',
              borderBottom: '1px solid #e5e7eb',
            }"
          >
            <td
              style="
                text-align: left;
                padding: 0.25rem 0.75rem;
                font-style: italic;
                color: #6b7280;
                position: sticky;
                left: 0;
                z-index: 1;
              "
              :style="{ backgroundColor: idx % 2 === 0 ? '#f9fafb' : '#fff' }"
            >
              {{ row.name }} - performance value
            </td>
            <template v-for="(d, di) in dates" :key="d + '-perfval'">
              <td
                colspan="2"
                style="padding: 0.25rem 0.5rem; text-align: center"
                :style="{
                  color: performanceValue(row, di) === null ? '#d1d5db'
                    : performanceValue(row, di)! > 0 ? '#3b82f6'
                    : performanceValue(row, di)! < 0 ? '#dc2626'
                    : '#374151',
                }"
              >
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
        <tr style="border-top: 2px solid #e5e7eb">
          <td
            style="
              text-align: left;
              padding: 0.375rem 0.75rem;
              font-weight: 700;
              position: sticky;
              left: 0;
              background: #fff;
              z-index: 1;
            "
          >
            Total
          </td>
          <template v-for="(t, di) in totals" :key="'total-' + di">
            <td style="padding: 0.25rem 0.5rem; font-weight: 600; color: #374151">
              {{ formatCurrency(t.before) }}
            </td>
            <td style="padding: 0.25rem 0.5rem; font-weight: 600; color: #374151">
              {{ formatCurrency(t.after) }}
            </td>
          </template>
        </tr>
        <tr>
          <td
            style="
              text-align: left;
              padding: 0.25rem 0.75rem;
              font-weight: 700;
              font-style: italic;
              color: #6b7280;
              position: sticky;
              left: 0;
              background: #fff;
              z-index: 1;
            "
          >
            Total - performance %
          </td>
          <template v-for="(d, di) in dates" :key="d + '-total-perf'">
            <td
              colspan="2"
              style="padding: 0.25rem 0.5rem; text-align: center; font-weight: 600"
              :style="{
                color: totalPerfPercent(di) === null ? '#d1d5db'
                  : totalPerfPercent(di)! > 0 ? '#3b82f6'
                  : totalPerfPercent(di)! < 0 ? '#dc2626'
                  : '#374151',
              }"
            >
              <template v-if="totalPerfPercent(di) !== null">
                {{ totalPerfPercent(di)! > 0 ? '+' : '' }}{{ formatPercent(totalPerfPercent(di)!) }}
              </template>
              <span v-else>&mdash;</span>
            </td>
          </template>
        </tr>
        <tr style="border-bottom: 2px solid #e5e7eb">
          <td
            style="
              text-align: left;
              padding: 0.25rem 0.75rem;
              font-weight: 700;
              font-style: italic;
              color: #6b7280;
              position: sticky;
              left: 0;
              background: #fff;
              z-index: 1;
            "
          >
            Total - performance value
          </td>
          <template v-for="(d, di) in dates" :key="d + '-total-perfval'">
            <td
              colspan="2"
              style="padding: 0.25rem 0.5rem; text-align: center; font-weight: 600"
              :style="{
                color: totalPerfValue(di) === null ? '#d1d5db'
                  : totalPerfValue(di)! > 0 ? '#3b82f6'
                  : totalPerfValue(di)! < 0 ? '#dc2626'
                  : '#374151',
              }"
            >
              <template v-if="totalPerfValue(di) !== null">
                {{ totalPerfValue(di)! > 0 ? '+' : '' }}{{ formatCurrency(totalPerfValue(di)!) }}
              </template>
              <span v-else>&mdash;</span>
            </td>
          </template>
        </tr>
      </tfoot>
    </table>
    <p v-else style="color: #9ca3af">No data to display.</p>
  </div>
</template>
