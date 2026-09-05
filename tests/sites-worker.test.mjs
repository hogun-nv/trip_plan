import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";
import worker from "../worker/index.js";

class MemoryD1 {
  constructor() { this.rows = new Map(); }
  prepare(sql) {
    const db = this;
    return {
      args: [],
      bind(...args) { this.args = args; return this; },
      async run() { return { success: true }; },
      async first() {
        if (sql.includes("SELECT data")) return db.rows.get(this.args[0]) || null;
        if (sql.includes("INSERT INTO shared_plans")) {
          const [id, data, updatedAt, updatedBy] = this.args;
          if (db.rows.has(id)) return null;
          const row = { data, revision: 1, updated_at: updatedAt, updated_by: updatedBy };
          db.rows.set(id, row); return row;
        }
        if (sql.includes("UPDATE shared_plans")) {
          const [data, updatedAt, updatedBy, id, baseRevision] = this.args;
          const current = db.rows.get(id);
          if (!current || current.revision !== baseRevision) return null;
          const row = { data, revision: current.revision + 1, updated_at: updatedAt, updated_by: updatedBy };
          db.rows.set(id, row); return row;
        }
        return null;
      },
    };
  }
}

const assets404 = { fetch: async () => new Response("missing", { status: 404 }) };

test("serves existing static assets without a fallback", async () => {
  const calls = [];
  const response = await worker.fetch(new Request("https://example.test/assets/app.js"), {
    ASSETS: {
      fetch: async (request) => {
        calls.push(new URL(request.url).pathname);
        return new Response("asset", { status: 200 });
      },
    },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(calls, ["/assets/app.js"]);
});

test("falls back to index.html for an unknown app route", async () => {
  const calls = [];
  const response = await worker.fetch(
    new Request("https://example.test/flow/step-two?source=share", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async (request) => {
          const url = new URL(request.url);
          calls.push(url.pathname + url.search);
          return new Response(url.pathname === "/index.html" ? "app" : "missing", {
            status: url.pathname === "/index.html" ? 200 : 404,
          });
        },
      },
    },
  );

  assert.equal(response.status, 200);
  assert.deepEqual(calls, ["/flow/step-two?source=share", "/index.html"]);
});

test("does not turn missing API or write requests into the app shell", async () => {
  for (const request of [
    new Request("https://example.test/api/missing", { headers: { accept: "application/json" } }),
    new Request("https://example.test/flow", { method: "POST", headers: { accept: "text/html" } }),
  ]) {
    let calls = 0;
    const response = await worker.fetch(request, {
      ASSETS: {
        fetch: async () => {
          calls += 1;
          return new Response("missing", { status: 404 });
        },
      },
    });

    assert.equal(response.status, 404);
    assert.equal(calls, 1);
  }
});

test("emits the files required by Sites packaging", async () => {
  await access(new URL("../dist/client/index.html", import.meta.url));
  await access(new URL("../dist/server/index.js", import.meta.url));
  await access(new URL("../dist/.openai/hosting.json", import.meta.url));
});

test("creates, reads, and updates a shared plan with revision checks", async () => {
  const DB = new MemoryD1();
  const url = "https://example.test/api/plans/trip_abcdefghijklmnopqrstuvwx";
  const firstPlan = { days: [{ id: "day-1", items: [] }] };
  const createResponse = await worker.fetch(new Request(url, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ data: firstPlan, updatedBy: "one", baseRevision: 0 }),
  }), { DB, ASSETS: assets404 });
  assert.equal(createResponse.status, 200);
  assert.equal((await createResponse.json()).revision, 1);

  const secondPlan = { days: [{ id: "day-1", items: [{ id: "a" }] }] };
  const updateResponse = await worker.fetch(new Request(url, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ data: secondPlan, updatedBy: "two", baseRevision: 1 }),
  }), { DB, ASSETS: assets404 });
  assert.equal(updateResponse.status, 200);
  assert.equal((await updateResponse.json()).revision, 2);

  const readResponse = await worker.fetch(new Request(url), { DB, ASSETS: assets404 });
  assert.equal(readResponse.status, 200);
  assert.deepEqual((await readResponse.json()).data, secondPlan);
});

test("returns the latest plan instead of silently overwriting a stale revision", async () => {
  const DB = new MemoryD1();
  const url = "https://example.test/api/plans/trip_zyxwvutsrqponmlkjihgfedc";
  const current = { days: [{ id: "day-1", items: [{ id: "remote" }] }] };
  await worker.fetch(new Request(url, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ data: current, updatedBy: "one", baseRevision: 0 }),
  }), { DB, ASSETS: assets404 });
  const staleResponse = await worker.fetch(new Request(url, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ data: { days: [{ id: "day-1", items: [] }] }, updatedBy: "two", baseRevision: 0 }),
  }), { DB, ASSETS: assets404 });
  assert.equal(staleResponse.status, 409);
  const payload = await staleResponse.json();
  assert.equal(payload.revision, 1);
  assert.deepEqual(payload.data, current);
});
