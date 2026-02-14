<script setup lang="ts">
import DashboardHeader from '@/components/DashboardHeader.vue'
import InstitutionFilter from '@/components/InstitutionFilter.vue'
import InvestmentChart from '@/components/InvestmentChart.vue'
</script>

<template>
  <div style="max-width: 1200px; margin: 0 auto; padding: 2rem">
    <DashboardHeader />
    <InstitutionFilter />
    <InvestmentChart />
  </div>
</template>
