<script setup lang="ts">
import { useInvestmentsStore } from '@/stores/investments'

const store = useInvestmentsStore()
</script>

<template>
  <div style="margin-bottom: 1.5rem">
    <div style="display: flex; gap: 0.5rem; margin-bottom: 0.75rem">
      <button @click="store.selectAll()">Select All</button>
      <button @click="store.selectNone()">Clear All</button>
    </div>
    <div style="display: flex; flex-wrap: wrap; gap: 0.75rem">
      <label
        v-for="name in store.institutionNames"
        :key="name"
        style="display: flex; align-items: center; gap: 0.25rem; cursor: pointer"
      >
        <input
          type="checkbox"
          :checked="store.selectedInstitutions.has(name)"
          @change="store.toggleInstitution(name)"
        />
        {{ name }}
      </label>
    </div>
  </div>
</template>
