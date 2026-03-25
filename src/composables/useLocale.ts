import { computed, ref } from "vue";
import { MESSAGES, type Locale } from "../constants/messages";

function detectBrowserLocale(): Locale {
  try {
    const lang = (
      navigator.language ||
      navigator.languages?.[0] ||
      ""
    ).toLowerCase();
    if (lang.startsWith("zh")) return "zh";
  } catch (err) {
    console.warn("Locale detection failed", err);
  }
  return "en";
}

export function useLocale() {
  const locale = ref<Locale>(detectBrowserLocale());
  const messages = computed(() => MESSAGES[locale.value]);
  const t = (key: string) => messages.value[key] || key;

  return {
    locale,
    t,
  };
}
