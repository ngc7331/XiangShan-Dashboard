<template>
  <div class="hero panel-surface">
    <div class="hero-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-btn"
        :class="{ active: selectedTabId === tab.id }"
        type="button"
        @click="$emit('tabChange', tab.id)"
      >
        {{ tabTitle(tab) }}
      </button>
    </div>
    <div v-if="showBadges || showBenchmarkBadge" class="badges">
      <div v-if="showBadges" class="badge">{{ runsLabel }}: {{ runCount }}</div>
      <div v-if="showBadges || showBenchmarkBadge" class="badge">
        {{ benchmarksLabel }}: {{ benchmarkCount }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TabConfig } from "../config/tabs";

defineProps<{
  tabs: TabConfig[];
  selectedTabId: string;
  tabTitle: (tab: TabConfig) => string;
  runsLabel: string;
  benchmarksLabel: string;
  runCount: number;
  benchmarkCount: number;
  showBadges?: boolean;
  showBenchmarkBadge?: boolean;
}>();

defineEmits<{
  (e: "tabChange", tabId: string): void;
}>();
</script>

<style scoped>
.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
}

.hero-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tab-btn {
  border: 1px solid #dce5f6;
  border-radius: var(--radius-control);
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

.badges {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.badge {
  padding: 6px 10px;
  background: #e6efff;
  color: #3a7ff6;
  border-radius: var(--radius-control);
  font-weight: 700;
  font-size: 12px;
}
</style>
