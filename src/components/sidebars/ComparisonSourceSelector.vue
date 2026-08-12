<template>
  <section class="panel-card source-card">
    <div class="section-title">{{ source.label }}</div>
    <div class="field-row">
      <label>{{ t("comparisonBranch") }}</label>
      <select
        class="control-input"
        :value="source.branch"
        @change="
          emit('branchChange', ($event.target as HTMLSelectElement).value)
        "
      >
        <option v-for="branch in source.branches" :key="branch" :value="branch">
          {{ branch }}
        </option>
      </select>
    </div>
    <div class="field-row">
      <label>{{ t("comparisonRun") }}</label>
      <select
        class="control-input"
        :value="source.runId"
        @change="emit('runChange', ($event.target as HTMLSelectElement).value)"
      >
        <option v-if="!source.runs.length" value="">{{ t("comparisonNoRuns") }}</option>
        <option v-for="run in sortedRuns" :key="run.hash" :value="run.runId">
          {{ run.runId }} · {{ run.hash.slice(0, 8) }}
        </option>
      </select>
    </div>
    <button
      class="paste-btn paste-row"
      type="button"
      :title="t('comparisonPasteHint')"
      @click="paste"
    >
      {{ t("comparisonPaste") }}
    </button>
    <p v-if="clipboardError" class="error-text">{{ clipboardError }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type {
  ComparisonSource,
  ComparisonSourceId,
} from "../../types/comparison";

const props = defineProps<{
  t: (key: string) => string;
  source: ComparisonSource;
  onPaste: (id: ComparisonSourceId) => Promise<void>;
}>();

const emit = defineEmits<{
  (e: "branchChange", value: string): void;
  (e: "runChange", value: string): void;
}>();

const clipboardError = ref("");
const sortedRuns = computed(() =>
  [...props.source.runs].sort((a, b) => Number(b.runId) - Number(a.runId)),
);

async function paste() {
  clipboardError.value = "";
  try {
    await props.onPaste(props.source.id);
  } catch (error) {
    clipboardError.value =
      error instanceof Error
        ? error.message
        : props.t("comparisonClipboardError");
  }
}
</script>
