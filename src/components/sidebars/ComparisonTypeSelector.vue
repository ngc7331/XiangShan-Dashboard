<template>
  <section class="panel-card">
    <div class="section-title">{{ t("comparisonType") }}</div>
    <select
      class="control-input"
      :value="comparisonType"
      @change="
        emit(
          'change',
          ($event.target as HTMLSelectElement).value as ComparisonSourceType,
        )
      "
    >
      <option v-for="option in typeOptions" :key="option.id" :value="option.id">
        {{ option.label }}
      </option>
    </select>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ComparisonSourceType } from "../../config/tabs";

const props = defineProps<{
  t: (key: string) => string;
  comparisonType: ComparisonSourceType;
}>();

const emit = defineEmits<{
  (e: "change", value: ComparisonSourceType): void;
}>();

const typeOptions = computed(() => [
  {
    id: "nightly" as ComparisonSourceType,
    label: props.t("comparisonNightly"),
  },
  {
    id: "weekly-gcc15" as ComparisonSourceType,
    label: props.t("comparisonWeeklyGcc15"),
  },
  {
    id: "weekly-xscc" as ComparisonSourceType,
    label: props.t("comparisonWeeklyXscc"),
  },
]);
</script>
