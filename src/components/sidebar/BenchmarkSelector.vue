<template>
  <div class="card">
    <div class="section-title">{{ t("testcasesTitle") }}</div>
    <div class="actions">
      <button class="btn" type="button" @click="$emit('selectDefault')">
        {{ t("default") }}
      </button>
      <button class="btn" type="button" @click="$emit('selectAll')">
        {{ t("selectAll") }}
      </button>
      <button class="btn" type="button" @click="$emit('clearSelection')">
        {{ t("clear") }}
      </button>
      <button
        v-if="showSpecButtons"
        class="btn"
        type="button"
        @click="$emit('selectSpec', 'SPEC06INT')"
      >
        {{ t("spec06int") }}
      </button>
      <button
        v-if="showSpecButtons"
        class="btn"
        type="button"
        @click="$emit('selectSpec', 'SPEC06FP')"
      >
        {{ t("spec06fp") }}
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
  (e: "selectSpec", value: "SPEC06INT" | "SPEC06FP"): void;
  (e: "toggleBenchmark", name: string): void;
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

.actions {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid #e1e6ef;
  background: #f2f6ff;
  color: #3a7ff6;
  font-weight: 700;
  cursor: pointer;
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
