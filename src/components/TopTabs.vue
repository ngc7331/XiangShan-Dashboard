<template>
  <div class="tabs">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      class="tab-btn"
      :class="{ active: modelValue === tab.id }"
      type="button"
      @click="$emit('update:modelValue', tab.id)"
    >
      {{ tabTitle(tab.titleKey) }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { DashboardTabConfig } from "../config/tabs";

defineProps<{
  tabs: DashboardTabConfig[];
  modelValue: string;
  tabTitle: (key: string) => string;
}>();

defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();
</script>

<style scoped>
.tabs {
  display: flex;
  gap: 8px;
  background: #ffffff;
  border: 1px solid #e1e6ef;
  border-radius: 14px;
  padding: 8px;
  box-shadow: 0 12px 32px rgba(17, 31, 64, 0.08);
}

.tab-btn {
  border: 1px solid #dce5f6;
  border-radius: 10px;
  padding: 8px 12px;
  background: #f7f9ff;
  color: #31435f;
  cursor: pointer;
  font-weight: 700;
}

.tab-btn.active {
  background: #3a7ff6;
  color: #ffffff;
  border-color: #3a7ff6;
}
</style>
