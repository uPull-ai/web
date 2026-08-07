// Tiny JSON-file datastore. No native build step, no external database —
// deliberately simple so this runs on any Node host without extra setup.
// Fine for a low-traffic campaign wall. For higher traffic or multi-instance
// hosting, swap this module for a real database (Postgres/Supabase) — every
// other file only calls the functions exported here, so that's a contained change.

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "postcards.json");

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ postcards: [] }, null, 2));
  }
}

function readAll() {
  ensureStore();
  const raw = fs.readFileSync(DATA_FILE, "utf8");
  try {
    return JSON.parse(raw);
  } catch {
    return { postcards: [] };
  }
}

function writeAll(data) {
  ensureStore();
  // write-to-temp-then-rename avoids a half-written file if the process dies mid-write
  const tmp = DATA_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}

function getAllPostcards() {
  return readAll().postcards;
}

function insertPostcard(postcard) {
  const data = readAll();
  data.postcards.push(postcard);
  writeAll(data);
  return postcard;
}

function findPostcard(id) {
  return readAll().postcards.find((p) => p.id === id) || null;
}

function updatePostcard(id, patch) {
  const data = readAll();
  const idx = data.postcards.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  data.postcards[idx] = { ...data.postcards[idx], ...patch };
  writeAll(data);
  return data.postcards[idx];
}

function deletePostcard(id) {
  const data = readAll();
  const before = data.postcards.length;
  data.postcards = data.postcards.filter((p) => p.id !== id);
  writeAll(data);
  return data.postcards.length < before;
}

module.exports = {
  getAllPostcards,
  insertPostcard,
  findPostcard,
  updatePostcard,
  deletePostcard,
};
