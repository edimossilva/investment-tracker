<script setup lang="ts">
import { ref, watch } from 'vue'
import DashboardHeader from '@/components/DashboardHeader.vue'
import PeriodFilter from '@/components/PeriodFilter.vue'
import InstitutionFilter from '@/components/InstitutionFilter.vue'
import InvestmentChart from '@/components/InvestmentChart.vue'
import ChartModeSelector from '@/components/ChartModeSelector.vue'
import InvestmentTable from '@/components/InvestmentTable.vue'
import SyncControls from '@/components/SyncControls.vue'
import SummaryBoard from '@/components/SummaryBoard.vue'
import { useAuth } from '@/composables/useAuth'
import { useInvestmentsStore } from '@/stores/investments'

const { user, authReady, signIn } = useAuth()
const store = useInvestmentsStore()

watch(user, (u) => {
  if (u) {
    store.loadForUser(u.uid)
  } else {
    store.clearData()
  }
})

const signingIn = ref(false)

async function handleSignIn() {
  signingIn.value = true
  try {
    await signIn()
  } finally {
    signingIn.value = false
  }
}
</script>

<template>
  <div v-if="!authReady" class="login-screen">
    <div class="login-card">
      <h1 class="login-title">Investment Tracker</h1>
      <p class="login-subtitle">Loading...</p>
    </div>
  </div>

  <div v-else-if="!user" class="login-screen">
    <div class="login-card">
      <h1 class="login-title">Investment Tracker</h1>
      <p class="login-subtitle">Sign in to access your portfolio</p>
      <button class="btn-google" :disabled="signingIn" @click="handleSignIn">
        Sign in with Google
      </button>
    </div>
  </div>

  <div v-else class="dashboard">
    <div class="header-row">
      <DashboardHeader />
      <div class="header-actions">
        <SyncControls />
      </div>
    </div>
    <div class="summary-row">
      <div class="card filters-card">
        <h2 class="card-title">Filters</h2>
        <PeriodFilter />
        <InstitutionFilter />
      </div>
      <SummaryBoard />
    </div>
    <div class="card">
      <InvestmentTable />
    </div>
    <div class="card chart-card">
      <h2 class="card-title">Chart</h2>
      <ChartModeSelector />
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

.card-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
  text-align: center;
}

.filters-card {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.chart-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.summary-row {
  display: flex;
  gap: 1.5rem;
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.login-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

.login-card {
  text-align: center;
  background: #fff;
  border-radius: 16px;
  padding: 3rem 2.5rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
}

.login-title {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.025em;
}

.login-subtitle {
  margin: 0.5rem 0 2rem;
  color: #64748b;
  font-size: 0.95rem;
}

.btn-google {
  padding: 0.65rem 1.75rem;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: #fff;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.btn-google:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-google:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
