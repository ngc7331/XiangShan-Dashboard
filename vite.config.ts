import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

const repoBase = "/XiangShan-Dashboard/";

export default defineConfig({
  plugins: [vue()],
  base: process.env.VITE_BASE || repoBase,
});
