<template>
  <section class="panel-card">
    <div class="section-title">{{ t("exportTitle") }}</div>
    <button
      class="paste-btn paste-row export-btn"
      type="button"
      :disabled="disabled || exporting"
      @click="exportImage"
    >
      {{ exporting ? t("exporting") : t("exportPng") }}
    </button>
    <p v-if="error" class="export-error">{{ error }}</p>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  t: (key: string) => string;
  disabled: boolean;
  onExport: () => Promise<void>;
}>();

const exporting = ref(false);
const error = ref("");

async function exportImage() {
  exporting.value = true;
  error.value = "";
  try {
    await props.onExport();
  } catch (reason) {
    error.value =
      reason instanceof Error ? reason.message : props.t("exportError");
  } finally {
    exporting.value = false;
  }
}
</script>

<style scoped>
.export-btn {
  width: 100%;
}

.export-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.export-error {
  margin: 8px 0 0;
  color: #b42318;
  font-size: 12px;
  font-weight: 700;
}
</style>
