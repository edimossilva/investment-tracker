<script setup lang="ts">
import { useInvestmentsStore, type Period } from '@/stores/investments'

const store = useInvestmentsStore()

const options: { value: Period; label: string }[] = [
  { value: 'full-time', label: 'Full time' },
  { value: 'past-12-months', label: 'Past 12 months' },
]
</script>

<template>
  <div style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.75rem">
    <span style="font-weight: 600">Period:</span>
    <label
      v-for="opt in options"
      :key="opt.value"
      style="display: flex; align-items: center; gap: 0.25rem; cursor: pointer"
    >
      <input
        type="radio"
        name="period"
        :value="opt.value"
        :checked="store.selectedPeriod === opt.value"
        @change="store.setPeriod(opt.value)"
      />
      {{ opt.label }}
    </label>
  </div>
</template>
