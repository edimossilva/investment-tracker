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

const chartData = computed(() => {
  const filtered = store.filteredInstitutions

  // Build unified sorted X-axis from all selected institutions' dates
  const dateSet = new Set<string>()
  for (const inst of filtered) {
    for (const rec of inst.investments) {
      dateSet.add(rec.date)
    }
  }
  const labels = Array.from(dateSet).sort()

  const datasets = filtered.flatMap((inst, i) => {
    const color = COLORS[store.institutionNames.indexOf(inst.institution) % COLORS.length]

    // Build date -> record map for alignment
    const dateMap = new Map(inst.investments.map((r) => [r.date, r]))

    const beforeData = labels.map((date) => {
      const rec = dateMap.get(date)
      return rec ? rec.amount_before_investment : null
    })

    const afterData = labels.map((date) => {
      const rec = dateMap.get(date)
      return rec ? rec.amount_after_investment : null
    })

    return [
      {
        label: `${inst.institution} (before)`,
        data: beforeData,
        borderColor: color,
        backgroundColor: color,
        borderWidth: 2,
        pointRadius: 2,
        spanGaps: true,
        tension: 0.1,
      },
      {
        label: `${inst.institution} (after)`,
        data: afterData,
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

  return { labels, datasets }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    title: {
      display: true,
      text: 'Investment History',
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
          return `${label}: ${formatCurrency(value)}`
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
            return formatCurrency(value)
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
