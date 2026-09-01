import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const [repositoryOwner, repositoryName] =
  process.env.GITHUB_REPOSITORY?.split("/") ?? [];
const isAccountSite =
  repositoryName?.toLowerCase() === `${repositoryOwner?.toLowerCase()}.github.io`;
const githubPagesBase =
  process.env.GITHUB_ACTIONS === "true" && repositoryName
    ? isAccountSite
      ? "/"
      : `/${repositoryName}/`
    : "/";
const deploymentBase = process.env.VITE_BASE_PATH || githubPagesBase;

export default defineConfig({
  base: deploymentBase,
  build: {
    outDir: "dist/client",
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [react()],
});
