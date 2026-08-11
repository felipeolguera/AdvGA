import { defineConfig } from "vite";
import { resolve } from "node:path";

const isCapacitor = process.env.CAPACITOR === "1";

export default defineConfig({
  // GitHub Pages needs /AdvGA/; the Android APK serves from a local origin with ./ 
  base: isCapacitor ? "./" : "/AdvGA/",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        tryit: resolve(__dirname, "tryit.html"),
      },
    },
  },
});
