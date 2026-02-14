<script setup lang="ts">
import DashboardHeader from '@/components/DashboardHeader.vue'
import PeriodFilter from '@/components/PeriodFilter.vue'
import InstitutionFilter from '@/components/InstitutionFilter.vue'
import InvestmentChart from '@/components/InvestmentChart.vue'
import InvestmentTable from '@/components/InvestmentTable.vue'
</script>

<template>
  <div class="dashboard">
    <DashboardHeader />
    <div class="card filters-card">
      <PeriodFilter />
      <InstitutionFilter />
    </div>
    <div class="card">
      <InvestmentTable />
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
</style>
