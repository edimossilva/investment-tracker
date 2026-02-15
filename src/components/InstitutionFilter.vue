<script setup lang="ts">
import { ref } from 'vue'
import { useInvestmentsStore } from '@/stores/investments'
import AddInstitutionModal from '@/components/AddInstitutionModal.vue'

const store = useInvestmentsStore()
const showAddModal = ref(false)
</script>

<template>
  <div class="institution-filter">
    <div class="top-row">
      <span class="label">Institutions</span>
      <div class="actions">
        <button class="action-btn" @click="store.selectAll()">Select All</button>
        <button class="action-btn" @click="store.selectNone()">Clear All</button>
      </div>
    </div>
    <div class="chips">
      <button
        v-for="name in store.institutionNames"
        :key="name"
        class="chip"
        :class="{ active: store.selectedInstitutions.has(name) }"
        @click="store.toggleInstitution(name)"
      >
        {{ name }}
      </button>
      <button class="chip chip-add" @click="showAddModal = true">+</button>
    </div>
    <AddInstitutionModal v-if="showAddModal" @close="showAddModal = false" />
  </div>
</template>

<style scoped>
.institution-filter {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.top-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.label {
  font-weight: 600;
  font-size: 0.8125rem;
  color: #475569;
}

.actions {
  display: flex;
  gap: 0.375rem;
}

.action-btn {
  border: none;
  background: none;
  padding: 0;
  font-size: 0.75rem;
  font-weight: 500;
  color: #3b82f6;
  cursor: pointer;
  font-family: inherit;
  transition: color 0.15s ease;
}

.action-btn:hover {
  color: #1d4ed8;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.chip {
  border: 1.5px solid #e2e8f0;
  background: #fff;
  padding: 0.3rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.chip:hover {
  border-color: #cbd5e1;
  color: #64748b;
}

.chip.active {
  background: #eff6ff;
  border-color: #3b82f6;
  color: #1e40af;
}

.chip-add {
  border-style: dashed;
  color: #3b82f6;
  border-color: #93c5fd;
  font-weight: 700;
}

.chip-add:hover {
  background: #eff6ff;
  border-color: #3b82f6;
}
</style>
