<script setup lang="ts">
import DashboardHeader from '@/components/DashboardHeader.vue'
import PeriodFilter from '@/components/PeriodFilter.vue'
import InstitutionFilter from '@/components/InstitutionFilter.vue'
import InvestmentChart from '@/components/InvestmentChart.vue'
import InvestmentTable from '@/components/InvestmentTable.vue'
</script>

<template>
  <div style="max-width: 1200px; margin: 0 auto; padding: 2rem">
    <DashboardHeader />
    <PeriodFilter />
    <InstitutionFilter />
    <InvestmentChart />
    <InvestmentTable />
  </div>
</template>
