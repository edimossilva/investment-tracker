<script setup lang="ts">
import { ref } from 'vue'
import { useInvestmentsStore } from '@/stores/investments'

const props = defineProps<{ editDate?: string }>()
const emit = defineEmits<{ close: [] }>()
const store = useInvestmentsStore()

const date = ref(props.editDate ?? '')

const latestByInstitution = new Map(
  store.institutions.map((inst) => {
    const last = inst.investments[inst.investments.length - 1]
    return [inst.institution, last] as const
  }),
)

const entries = ref(
  store.institutions.map((inst) => {
    if (props.editDate) {
      const rec = inst.investments.find((r) => r.date === props.editDate)
      return {
        institution: inst.institution,
        before: rec?.amount_before_investment ?? 0,
        after: rec?.amount_after_investment ?? 0,
      }
    }
    const lastAfter = inst.investments[inst.investments.length - 1]?.amount_after_investment ?? 0
    return {
      institution: inst.institution,
      before: lastAfter,
      after: lastAfter,
    }
  }),
)

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function save() {
  if (!date.value) return
  const records = new Map<string, { before: number; after: number }>()
  for (const e of entries.value) {
    records.set(e.institution, { before: e.before, after: e.after })
  }
  store.addRecords(date.value, records)
  emit('close')
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal">
      <h2 class="modal-title">Add Entry</h2>

      <div class="date-row">
        <label class="date-label" for="entry-date">Date</label>
        <input id="entry-date" v-model="date" type="date" class="date-input" />
      </div>

      <div class="table-wrapper">
        <table class="entry-table">
          <thead>
            <tr>
              <th>Institution</th>
              <th>Before</th>
              <th>After</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in entries" :key="entry.institution">
              <td class="inst-name">{{ entry.institution }}</td>
              <td>
                <input
                  v-model.number="entry.before"
                  type="number"
                  step="0.01"
                  min="0"
                  class="amount-input"
                />
                <span
                  v-if="latestByInstitution.get(entry.institution)"
                  class="hint"
                >
                  {{
                    formatCurrency(
                      latestByInstitution.get(entry.institution)!.amount_after_investment,
                    )
                  }}
                </span>
              </td>
              <td>
                <input
                  v-model.number="entry.after"
                  type="number"
                  step="0.01"
                  min="0"
                  class="amount-input"
                />
                <span
                  v-if="latestByInstitution.get(entry.institution)"
                  class="hint"
                >
                  {{
                    formatCurrency(
                      latestByInstitution.get(entry.institution)!.amount_after_investment,
                    )
                  }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="modal-footer">
        <button class="btn btn-cancel" @click="emit('close')">Cancel</button>
        <button class="btn btn-save" :disabled="!date" @click="save">Save</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  width: min(560px, 90vw);
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.modal-title {
  margin: 0 0 1rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
}

.date-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.date-label {
  font-weight: 600;
  color: #334155;
  font-size: 0.875rem;
}

.date-input {
  padding: 0.4rem 0.6rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.875rem;
}

.table-wrapper {
  overflow-y: auto;
  flex: 1;
}

.entry-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.entry-table th {
  text-align: left;
  padding: 0.5rem 0.5rem;
  color: #64748b;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 2px solid #e2e8f0;
}

.entry-table td {
  padding: 0.4rem 0.5rem;
  border-bottom: 1px solid #f1f5f9;
}

.inst-name {
  font-weight: 500;
  color: #0f172a;
}

.amount-input {
  width: 100%;
  padding: 0.35rem 0.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.875rem;
  box-sizing: border-box;
}

.hint {
  display: block;
  font-size: 0.7rem;
  color: #94a3b8;
  margin-top: 2px;
}

.amount-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.btn {
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-cancel {
  background: #f1f5f9;
  color: #475569;
}

.btn-cancel:hover {
  background: #e2e8f0;
}

.btn-save {
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: #fff;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.btn-save:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
