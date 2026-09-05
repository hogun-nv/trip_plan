#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const index = path.join(dist, "client", "index.html");
const worker = path.join(root, "worker", "index.js");
const planStore = path.join(root, "worker", "plan-store.js");
const migration = path.join(root, "db", "migrations", "0000_shared_plans.sql");
const hosting = path.join(root, ".openai", "hosting.json");

for (const file of [index, worker, planStore, migration, hosting]) {
  if (!existsSync(file)) throw new Error("Missing Sites build input: " + file);
}

mkdirSync(path.join(dist, "server"), { recursive: true });
mkdirSync(path.join(dist, ".openai"), { recursive: true });
copyFileSync(worker, path.join(dist, "server", "index.js"));
copyFileSync(planStore, path.join(dist, "server", "plan-store.js"));
copyFileSync(hosting, path.join(dist, ".openai", "hosting.json"));
mkdirSync(path.join(dist, ".openai", "drizzle"), { recursive: true });
copyFileSync(migration, path.join(dist, ".openai", "drizzle", "0000_shared_plans.sql"));

console.log("Prepared Sites build: dist/server/index.js and dist/.openai/hosting.json");
