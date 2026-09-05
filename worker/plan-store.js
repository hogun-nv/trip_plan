const CREATE_SHARED_PLANS = `
  CREATE TABLE IF NOT EXISTS shared_plans (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    revision INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL,
    updated_by TEXT NOT NULL
  )
`;

const initializedDatabases = new WeakSet();

async function initialize(db) {
  if (initializedDatabases.has(db)) return;
  await db.prepare(CREATE_SHARED_PLANS).run();
  initializedDatabases.add(db);
}

export async function readSharedPlan(db, id) {
  await initialize(db);
  const row = await db.prepare("SELECT data, revision, updated_at, updated_by FROM shared_plans WHERE id = ?").bind(id).first();
  if (!row) return null;
  return {
    data: JSON.parse(row.data),
    revision: row.revision,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

function parseRow(row) {
  if (!row) return null;
  return {
    data: JSON.parse(row.data),
    revision: row.revision,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

export async function writeSharedPlan(db, id, data, updatedBy, baseRevision) {
  await initialize(db);
  const now = new Date().toISOString();
  const serialized = JSON.stringify(data);
  let row = null;
  if (baseRevision === 0) {
    row = await db.prepare(`
      INSERT INTO shared_plans (id, data, revision, updated_at, updated_by)
      VALUES (?, ?, 1, ?, ?)
      ON CONFLICT(id) DO NOTHING
      RETURNING data, revision, updated_at, updated_by
    `).bind(id, serialized, now, updatedBy).first();
  } else {
    row = await db.prepare(`
      UPDATE shared_plans
      SET data = ?, revision = revision + 1, updated_at = ?, updated_by = ?
      WHERE id = ? AND revision = ?
      RETURNING data, revision, updated_at, updated_by
    `).bind(serialized, now, updatedBy, id, baseRevision).first();
  }
  if (row) return { conflict: false, record: parseRow(row) };
  return { conflict: true, record: await readSharedPlan(db, id) };
}
