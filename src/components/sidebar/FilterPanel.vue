<template>
  <div class="card controls">
    <div class="section-title">{{ t("filtersTitle") }}</div>
    <div class="row">
      <label>{{ t("branch") }}</label>
      <select
        class="control-input"
        :value="selectedBranch"
        @change="
          $emit('branchChange', ($event.target as HTMLSelectElement).value)
        "
      >
        <option v-for="branch in branches" :key="branch" :value="branch">
          {{ branch }}
        </option>
      </select>
    </div>
    <div class="row">
      <label>{{ t("startDate") }}</label>
      <input
        class="control-input"
        type="date"
        :value="startDateStr"
        @change="
          $emit('startDateChange', ($event.target as HTMLInputElement).value)
        "
      />
    </div>
    <div class="row">
      <label>{{ t("endDate") }}</label>
      <input
        class="control-input"
        type="date"
        :value="endDateStr"
        @change="
          $emit('endDateChange', ($event.target as HTMLInputElement).value)
        "
      />
    </div>
    <div class="btn-row">
      <button
        class="btn"
        :class="{ active: activeQuickDays === 7 }"
        type="button"
        @click="$emit('setLastDays', 7)"
      >
        {{ t("lastWeek") }}
      </button>
      <button
        class="btn"
        :class="{ active: activeQuickDays === 31 }"
        type="button"
        @click="$emit('setLastDays', 31)"
      >
        {{ t("lastMonth") }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  t: (key: string) => string;
  branches: string[];
  selectedBranch: string;
  startDateStr: string;
  endDateStr: string;
  activeQuickDays: number | null;
}>();

defineEmits<{
  (e: "branchChange", value: string): void;
  (e: "startDateChange", value: string): void;
  (e: "endDateChange", value: string): void;
  (e: "setLastDays", days: number): void;
}>();
</script>

<style scoped>
.card {
  background: #ffffff;
  border: 1px solid #e1e6ef;
  border-radius: 14px;
  padding: 14px 16px;
  box-shadow: 0 12px 32px rgba(17, 31, 64, 0.08);
}

.section-title {
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #5b6070;
  margin: 0 0 8px;
}

.row {
  margin-bottom: 10px;
  display: flex;
  gap: 10px;
  align-items: center;
}

.controls label {
  display: block;
  font-size: 13px;
  color: #5b6070;
  margin-bottom: 6px;
  font-weight: 600;
  white-space: nowrap;
}

.controls .control-input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #e1e6ef;
  background: #fdfefe;
  font-size: 14px;
  color: #1c1f2a;
}

.btn-row {
  margin-top: 10px;
  display: flex;
  gap: 8px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #e1e6ef;
  background: #f2f6ff;
  color: #3a7ff6;
  font-weight: 700;
  cursor: pointer;
}

.btn.active {
  background: #3a7ff6;
  border-color: #3a7ff6;
  color: #ffffff;
}
</style>
