<script setup lang="ts">
import { ref } from 'vue'
import DashboardHeader from '@/components/DashboardHeader.vue'
import PeriodFilter from '@/components/PeriodFilter.vue'
import InstitutionFilter from '@/components/InstitutionFilter.vue'
import InvestmentChart from '@/components/InvestmentChart.vue'
import InvestmentTable from '@/components/InvestmentTable.vue'
import AddEntryModal from '@/components/AddEntryModal.vue'
import SyncControls from '@/components/SyncControls.vue'

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
</script>

<template>
  <div class="dashboard">
    <div class="header-row">
      <DashboardHeader />
      <div class="header-actions">
        <SyncControls />
        <button class="btn-add" @click="showAddModal = true">+ Add Entry</button>
      </div>
    </div>
    <AddEntryModal v-if="showAddModal" :edit-date="editDate" @close="closeModal" />
    <div class="card filters-card">
      <PeriodFilter />
      <InstitutionFilter />
    </div>
    <div class="card">
      <InvestmentTable @edit-date="openEdit" />
    </div>
    <div class="card">
      <InvestmentChart />
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06);
}

.filters-card {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.header-row > :first-child {
  flex: 1;
}

.btn-add {
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: #fff;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  white-space: nowrap;
}

.btn-add:hover {
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}
</style>
