import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  base: "/AdvGA/",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        tryit: resolve(__dirname, "tryit.html"),
      },
    },
  },
});
