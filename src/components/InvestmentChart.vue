<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { useInvestmentsStore } from '@/stores/investments'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const store = useInvestmentsStore()

const COLORS = [
  '#8b5cf6', // purple
  '#3b82f6', // blue
  '#10b981', // green
  '#ef4444', // red
  '#f59e0b', // amber
  '#ec4899', // pink
  '#6366f1', // indigo
]

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatSignedCurrency(value: number): string {
  const formatted = formatCurrency(Math.abs(value))
  return value >= 0 ? `+${formatted}` : `-${formatted}`
}

function getColor(institution: string): string {
  return COLORS[store.institutionNames.indexOf(institution) % COLORS.length]!
}

const chartTitle = computed(() => {
  const titles: Record<string, string> = {
    'portfolio-value': 'Portfolio Value',
    'value-added': 'Value Added per Period',
    performance: 'Performance (Returns)',
    'total-portfolio': 'Total Portfolio',
  }
  return titles[store.chartMode] || 'Investment History'
})

const chartData = computed(() => {
  const filtered = store.filteredInstitutions

  const dateSet = new Set<string>()
  for (const inst of filtered) {
    for (const rec of inst.investments) {
      dateSet.add(rec.date)
    }
  }
  const labels = Array.from(dateSet).sort()

  if (store.chartMode === 'portfolio-value') {
    return { labels, datasets: buildPortfolioValue(filtered, labels) }
  }
  if (store.chartMode === 'value-added') {
    return { labels, datasets: buildValueAdded(filtered, labels) }
  }
  if (store.chartMode === 'performance') {
    return { labels, datasets: buildPerformance(filtered, labels) }
  }
  if (store.chartMode === 'total-portfolio') {
    return { labels, datasets: buildTotalPortfolio(filtered, labels) }
  }
  return { labels, datasets: [] }
})

function buildPortfolioValue(
  filtered: typeof store.filteredInstitutions,
  labels: string[],
) {
  return filtered.flatMap((inst) => {
    const color = getColor(inst.institution)
    const dateMap = new Map(inst.investments.map((r) => [r.date, r]))

    return [
      {
        label: `${inst.institution} (before)`,
        data: labels.map((d) => dateMap.get(d)?.amount_before_investment ?? null),
        borderColor: color,
        backgroundColor: color,
        borderWidth: 2,
        pointRadius: 2,
        spanGaps: true,
        tension: 0.1,
      },
      {
        label: `${inst.institution} (after)`,
        data: labels.map((d) => dateMap.get(d)?.amount_after_investment ?? null),
        borderColor: color,
        backgroundColor: color,
        borderDash: [5, 5],
        borderWidth: 2,
        pointRadius: 2,
        spanGaps: true,
        tension: 0.1,
      },
    ]
  })
}

function buildValueAdded(
  filtered: typeof store.filteredInstitutions,
  labels: string[],
) {
  return filtered.map((inst) => {
    const color = getColor(inst.institution)
    const dateMap = new Map(inst.investments.map((r) => [r.date, r]))

    return {
      label: inst.institution,
      data: labels.map((d) => {
        const rec = dateMap.get(d)
        return rec ? rec.amount_after_investment - rec.amount_before_investment : null
      }),
      borderColor: color,
      backgroundColor: color,
      borderWidth: 2,
      pointRadius: 3,
      spanGaps: true,
      tension: 0.1,
    }
  })
}

function buildPerformance(
  filtered: typeof store.filteredInstitutions,
  labels: string[],
) {
  return filtered.map((inst) => {
    const color = getColor(inst.institution)
    const dateMap = new Map(inst.investments.map((r) => [r.date, r]))

    // Get sorted dates that exist for this institution within the labels
    const instDates = labels.filter((d) => dateMap.has(d))
    const prevAfterMap = new Map<string, number>()
    for (let i = 1; i < instDates.length; i++) {
      prevAfterMap.set(instDates[i]!, dateMap.get(instDates[i - 1]!)!.amount_after_investment)
    }

    return {
      label: inst.institution,
      data: labels.map((d) => {
        const rec = dateMap.get(d)
        const prevAfter = prevAfterMap.get(d)
        if (!rec || prevAfter === undefined) return null
        return rec.amount_before_investment - prevAfter
      }),
      borderColor: color,
      backgroundColor: color,
      borderWidth: 2,
      pointRadius: 3,
      spanGaps: true,
      tension: 0.1,
    }
  })
}

function buildTotalPortfolio(
  filtered: typeof store.filteredInstitutions,
  labels: string[],
) {
  const dateMaps = filtered.map((inst) =>
    new Map(inst.investments.map((r) => [r.date, r])),
  )

  const totalBefore = labels.map((d) => {
    let sum = 0
    let any = false
    for (const dm of dateMaps) {
      const rec = dm.get(d)
      if (rec) {
        sum += rec.amount_before_investment
        any = true
      }
    }
    return any ? sum : null
  })

  const totalAfter = labels.map((d) => {
    let sum = 0
    let any = false
    for (const dm of dateMaps) {
      const rec = dm.get(d)
      if (rec) {
        sum += rec.amount_after_investment
        any = true
      }
    }
    return any ? sum : null
  })

  return [
    {
      label: 'Total (before)',
      data: totalBefore,
      borderColor: '#3b82f6',
      backgroundColor: '#3b82f6',
      borderWidth: 2,
      pointRadius: 2,
      spanGaps: true,
      tension: 0.1,
    },
    {
      label: 'Total (after)',
      data: totalAfter,
      borderColor: '#3b82f6',
      backgroundColor: '#3b82f6',
      borderDash: [5, 5],
      borderWidth: 2,
      pointRadius: 2,
      spanGaps: true,
      tension: 0.1,
    },
  ]
}

const useSignedFormat = computed(() =>
  store.chartMode === 'value-added' || store.chartMode === 'performance',
)

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    title: {
      display: true,
      text: chartTitle.value,
      font: { size: 14, weight: 'bold' as const },
      color: '#0f172a',
      padding: { bottom: 16 },
    },
    tooltip: {
      backgroundColor: '#1e293b',
      titleFont: { size: 12 },
      bodyFont: { size: 12 },
      cornerRadius: 8,
      padding: 10,
      callbacks: {
        label: (context: { dataset: { label?: string }; parsed: { y: number | null } }) => {
          const label = context.dataset.label || ''
          const value = context.parsed.y
          if (value === null) return label
          const formatted = useSignedFormat.value
            ? formatSignedCurrency(value)
            : formatCurrency(value)
          return `${label}: ${formatted}`
        },
      },
    },
    legend: {
      position: 'bottom' as const,
      labels: {
        boxWidth: 16,
        padding: 16,
        usePointStyle: true,
        pointStyle: 'circle' as const,
        font: { size: 12 },
        color: '#475569',
      },
    },
  },
  scales: {
    y: {
      grid: { color: '#f1f5f9' },
      border: { display: false },
      ticks: {
        color: '#94a3b8',
        font: { size: 11 },
        callback: (value: string | number) => {
          if (typeof value === 'number') {
            return useSignedFormat.value ? formatSignedCurrency(value) : formatCurrency(value)
          }
          return value
        },
      },
    },
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: {
        color: '#94a3b8',
        font: { size: 11 },
        maxRotation: 45,
        autoSkip: true,
        maxTicksLimit: 20,
      },
    },
  },
}))
</script>

<template>
  <div class="chart-wrapper">
    <Line v-if="chartData.datasets.length > 0" :data="chartData" :options="chartOptions" />
    <p v-else class="empty">Select at least one institution to display the chart.</p>
  </div>
</template>

<style scoped>
.chart-wrapper {
  position: relative;
  height: 500px;
}

.empty {
  text-align: center;
  color: #94a3b8;
  padding-top: 4rem;
  margin: 0;
}
</style>
