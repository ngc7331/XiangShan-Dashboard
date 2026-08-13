<template>
  <section class="panel-card">
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
        <option v-if="!source.runs.length" value="">
          {{ t("comparisonNoRuns") }}
        </option>
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
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
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
  (e: "pasteError", value: string): void;
}>();

const sortedRuns = computed(() =>
  [...props.source.runs].sort((a, b) => Number(b.runId) - Number(a.runId)),
);

async function paste() {
  try {
    await props.onPaste(props.source.id);
  } catch (error) {
    emit(
      "pasteError",
      error instanceof Error
        ? error.message
        : props.t("comparisonClipboardError"),
    );
  }
}
</script>
