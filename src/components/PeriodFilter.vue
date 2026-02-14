<script setup lang="ts">
import { useInvestmentsStore, type Period } from '@/stores/investments'

const store = useInvestmentsStore()

const options: { value: Period; label: string }[] = [
  { value: 'past-3-months', label: 'Past 3 months' },
  { value: 'past-6-months', label: 'Past 6 months' },
  { value: 'past-12-months', label: 'Past 12 months' },
  { value: 'full-time', label: 'Full time' },
]
</script>

<template>
  <div class="period-filter">
    <span class="label">Period</span>
    <div class="options">
      <button
        v-for="opt in options"
        :key="opt.value"
        class="option"
        :class="{ active: store.selectedPeriod === opt.value }"
        @click="store.setPeriod(opt.value)"
      >
        {{ opt.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.period-filter {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.label {
  font-weight: 600;
  font-size: 0.8125rem;
  color: #475569;
}

.options {
  display: flex;
  gap: 0.25rem;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 3px;
}

.option {
  border: none;
  background: transparent;
  padding: 0.375rem 0.875rem;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.option:hover {
  color: #334155;
}

.option.active {
  background: #fff;
  color: #1e293b;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>
