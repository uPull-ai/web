// Postgres-backed datastore (Supabase or any Postgres works). Replaces the
// old local-JSON-file version, which lost every postcard whenever the Render
// service redeployed or spun down after being idle, since that filesystem
// isn't persistent on Render's free tier.
//
// Needs a DATABASE_URL environment variable (a Postgres connection string).
// Set it in Render's dashboard under Environment, never commit it to the repo.
// The table is created automatically on first startup if it doesn't exist yet.

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

let readyPromise = null;

function ensureStore() {
  if (!readyPromise) {
    readyPromise = pool.query(`
      CREATE TABLE IF NOT EXISTS postcards (
        id text PRIMARY KEY,
        name text NOT NULL,
        role text DEFAULT '',
        beat text DEFAULT '',
        type text DEFAULT 'word',
        video_url text DEFAULT '',
        email text DEFAULT '',
        message text NOT NULL,
        status text NOT NULL DEFAULT 'pending',
        edit_token_hash text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        approved_at timestamptz
      );
    `);
  }
  return readyPromise;
}

// Converts a Postgres row (snake_case) to the shape the rest of the app
// already expects (camelCase), so server.js needs no changes beyond adding
// "await" where these functions are called.
function toPostcard(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    role: row.role || "",
    beat: row.beat || "",
    type: row.type || "word",
    videoUrl: row.video_url || "",
    email: row.email || "",
    message: row.message,
    status: row.status,
    editTokenHash: row.edit_token_hash,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    approvedAt: row.approved_at
      ? (row.approved_at instanceof Date ? row.approved_at.toISOString() : row.approved_at)
      : null,
  };
}

async function getAllPostcards() {
  await ensureStore();
  const { rows } = await pool.query("SELECT * FROM postcards");
  return rows.map(toPostcard);
}

async function insertPostcard(postcard) {
  await ensureStore();
  await pool.query(
    `INSERT INTO postcards
      (id, name, role, beat, type, video_url, email, message, status, edit_token_hash, created_at, approved_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [
      postcard.id,
      postcard.name,
      postcard.role || "",
      postcard.beat || "",
      postcard.type || "word",
      postcard.videoUrl || "",
      postcard.email || "",
      postcard.message,
      postcard.status || "pending",
      postcard.editTokenHash,
      postcard.createdAt || new Date().toISOString(),
      postcard.approvedAt || null,
    ]
  );
  return postcard;
}

async function findPostcard(id) {
  await ensureStore();
  const { rows } = await pool.query("SELECT * FROM postcards WHERE id = $1", [id]);
  return toPostcard(rows[0]);
}

async function updatePostcard(id, patch) {
  await ensureStore();
  const existing = await findPostcard(id);
  if (!existing) return null;
  const merged = { ...existing, ...patch };
  await pool.query(
    `UPDATE postcards SET
      name=$2, role=$3, beat=$4, type=$5, video_url=$6, email=$7, message=$8,
      status=$9, edit_token_hash=$10, created_at=$11, approved_at=$12
     WHERE id=$1`,
    [
      id,
      merged.name,
      merged.role || "",
      merged.beat || "",
      merged.type || "word",
      merged.videoUrl || "",
      merged.email || "",
      merged.message,
      merged.status,
      merged.editTokenHash,
      merged.createdAt,
      merged.approvedAt || null,
    ]
  );
  return merged;
}

async function deletePostcard(id) {
  await ensureStore();
  const result = await pool.query("DELETE FROM postcards WHERE id = $1", [id]);
  return result.rowCount > 0;
}

module.exports = {
  getAllPostcards,
  insertPostcard,
  findPostcard,
  updatePostcard,
  deletePostcard,
};
