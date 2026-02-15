<script setup lang="ts">
import { ref, computed } from 'vue'
import { useInvestmentsStore } from '@/stores/investments'

const emit = defineEmits<{ close: [] }>()
const store = useInvestmentsStore()

const name = ref('')
const nameExists = computed(() =>
  store.institutionNames.some((n) => n.toLowerCase() === name.value.trim().toLowerCase()),
)
const canSave = computed(() => name.value.trim() !== '' && !nameExists.value)

function save() {
  if (!canSave.value) return
  store.addInstitution(name.value.trim())
  emit('close')
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal">
      <h2 class="modal-title">Add Institution</h2>

      <div class="field">
        <label class="field-label" for="inst-name">Institution Name</label>
        <input
          id="inst-name"
          v-model="name"
          type="text"
          class="field-input"
          placeholder="e.g. Nubank"
          @keydown.enter="save"
        />
        <span v-if="nameExists" class="error">Institution already exists</span>
      </div>

      <div class="modal-footer">
        <button class="btn btn-cancel" @click="emit('close')">Cancel</button>
        <button class="btn btn-save" :disabled="!canSave" @click="save">Save</button>
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
  width: min(400px, 90vw);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.modal-title {
  margin: 0 0 1rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field-label {
  font-weight: 600;
  color: #334155;
  font-size: 0.875rem;
}

.field-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.875rem;
}

.field-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.error {
  font-size: 0.75rem;
  color: #ef4444;
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
