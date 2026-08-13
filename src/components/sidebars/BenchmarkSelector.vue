<template>
  <div class="panel-card benchmark-card">
    <div class="section-title">{{ t("testcasesTitle") }}</div>
    <div class="actions">
      <button class="sidebar-btn" type="button" @click="$emit('selectDefault')">
        {{ t("default") }}
      </button>
      <button class="sidebar-btn" type="button" @click="$emit('selectAll')">
        {{ t("selectAll") }}
      </button>
      <button
        class="sidebar-btn"
        type="button"
        @click="$emit('clearSelection')"
      >
        {{ t("clear") }}
      </button>
      <button class="sidebar-btn" type="button" @click="$emit('selectGeomean')">
        {{ t("geomean") }}
      </button>
      <button
        v-if="showSpecButtons"
        class="sidebar-btn"
        type="button"
        @click="$emit('selectSpec', 'int')"
      >
        {{ t("specInt") }}
      </button>
      <button
        v-if="showSpecButtons"
        class="sidebar-btn"
        type="button"
        @click="$emit('selectSpec', 'fp')"
      >
        {{ t("specFp") }}
      </button>
    </div>
    <div class="list">
      <div
        v-for="name in benchmarks"
        :key="name"
        class="item"
        :class="{ selected: selected.includes(name) }"
        role="button"
        :aria-pressed="selected.includes(name)"
        tabindex="0"
        @click="$emit('toggleBenchmark', name)"
        @keydown.enter.prevent="$emit('toggleBenchmark', name)"
        @keydown.space.prevent="$emit('toggleBenchmark', name)"
      >
        <span>{{ name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SpecCategory } from "../../config/spec";

defineProps<{
  t: (key: string) => string;
  benchmarks: string[];
  selected: string[];
  showSpecButtons: boolean;
}>();

defineEmits<{
  (e: "selectDefault"): void;
  (e: "selectAll"): void;
  (e: "clearSelection"): void;
  (e: "selectSpec", value: SpecCategory): void;
  (e: "selectGeomean"): void;
  (e: "toggleBenchmark", name: string): void;
}>();
</script>

<style scoped>
.benchmark-card {
  display: flex;
  flex-direction: column;
}

.actions {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.list {
  max-height: 40vh;
  overflow-y: auto;
  overflow-x: hidden;
  border: 1px solid #e1e6ef;
  border-radius: 12px;
  padding: 8px 10px;
  background: #fcfdff;
  font-size: 13px;
}

.item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 4px;
  border-bottom: 1px dashed #eef1f6;
  cursor: pointer;
  border-radius: 8px;
}

.item:last-child {
  border-bottom: none;
}

.item.selected {
  background: #e6efff;
}
</style>
