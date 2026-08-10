require("dotenv").config();
const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const db = require("./db");

const PORT = process.env.PORT || 3001;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "fivba3-hobNes-vyzdod";
const WEB3FORMS_ACCESS_KEY = process.env.WEB3FORMS_ACCESS_KEY || "8bdba7a3-9c31-46ef-a6e3-f985ac4337e2";
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

if (!ADMIN_PASSWORD) {
  console.warn(
    "[warn] ADMIN_PASSWORD is not set — admin approve/reject/delete will refuse every request until you set it in .env"
  );
}
if (!WEB3FORMS_ACCESS_KEY) {
  console.warn(
    "[warn] WEB3FORMS_ACCESS_KEY is not set — new postcard notification emails to the admin team will be skipped"
  );
}

const app = express();
app.use(express.json({ limit: "20kb" }));
app.use(
  cors({
    origin: ALLOWED_ORIGIN === "*" ? true : ALLOWED_ORIGIN.split(",").map((s) => s.trim()),
  })
);

// ---- helpers -------------------------------------------------------------

function sha256(input) {
  return crypto.createHash("sha256").update(String(input)).digest("hex");
}

// constant-time-ish compare for shared-secret strings (admin password, tokens)
function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function isAdmin(req) {
  const supplied = req.get("x-admin-password") || "";
  if (!ADMIN_PASSWORD || !supplied) return false;
  return safeEqual(supplied, ADMIN_PASSWORD);
}

// parses "id1:token1,id2:token2" from the x-edit-tokens header
function parseEditTokens(req) {
  const header = req.get("x-edit-tokens") || "";
  const map = new Map();
  header
    .split(",")
    .map((pair) => pair.trim())
    .filter(Boolean)
    .forEach((pair) => {
      const [id, token] = pair.split(":");
      if (id && token) map.set(id, token);
    });
  return map;
}

function publicShape(postcard, extra = {}) {
  const { id, name, role, beat, type, videoUrl, message, status, createdAt } = postcard;
  return {
    id,
    name,
    role: role || "",
    beat: beat || "",
    type: type || "word",
    videoUrl: videoUrl || "",
    message,
    status,
    createdAt,
    ...extra,
  };
}

function adminShape(postcard) {
  const { id, name, role, beat, type, videoUrl, email, message, status, createdAt, approvedAt } = postcard;
  return {
    id,
    name,
    role: role || "",
    beat: beat || "",
    type: type || "word",
    videoUrl: videoUrl || "",
    email: email || "",
    message,
    status,
    createdAt,
    approvedAt: approvedAt || null,
  };
}

async function notifyAdmin(postcard) {
  if (!WEB3FORMS_ACCESS_KEY) return;
  try {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: "New Postcard From 2030 submission — needs review",
        from_name: "uPull.ai Postcards Wall",
        email: postcard.email || "no-email-given@upull.ai",
        message:
          `A new ${postcard.type === "video" ? "video" : "word"} postcard is waiting for verification before it can appear on the public wall.\n\n` +
          `Name: ${postcard.name}\n` +
          `Role/organisation: ${postcard.role || "(not given)"}\n` +
          `Starting prompt: ${postcard.beat || "(not given)"}\n` +
          `Submitter email: ${postcard.email || "(not given)"}\n` +
          (postcard.type === "video" ? `Video link: ${postcard.videoUrl}\n` : "") +
          `\nPostcard text:\n${postcard.message}\n\n` +
          `Submitted: ${postcard.createdAt}\n` +
          `Postcard ID: ${postcard.id}\n\n` +
          `Review it from the wall page using the admin panel (unlock with the admin password) before it goes public.`,
      }),
    });
    const data = await res.json();
    if (!data.success) {
      console.error("[web3forms] notification failed:", data.message || data);
    }
  } catch (err) {
    console.error("[web3forms] notification request errored:", err.message);
  }
}

// ---- rate limiting (basic spam control on submissions) ------------------

const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many postcards from this connection recently — please try again later." },
});

// ---- routes ---------------------------------------------------------------

app.get("/api/health", (req, res) => res.json({ ok: true }));

// Create a postcard. Always starts as "pending" — it is not visible on the
// public wall, and the admin team is emailed to review it, until an admin
// approves it. The response includes a one-time editToken the browser must
// hang on to (e.g. in localStorage) to prove authorship later.
app.post("/api/postcards", submitLimiter, async (req, res) => {
  const { name, role, beat, type, videoUrl, email, message, website } = req.body || {};

  // honeypot: real users never fill this hidden field, bots often do
  if (website) return res.status(201).json({ id: crypto.randomUUID(), editToken: "n/a", status: "pending" });

  const cleanName = String(name || "").trim();
  const cleanRole = String(role || "").trim();
  const cleanBeat = String(beat || "").trim();
  const cleanEmail = String(email || "").trim();
  const cleanMessage = String(message || "").trim();
  const cleanType = type === "video" ? "video" : "word";
  const cleanVideoUrl = String(videoUrl || "").trim();

  if (cleanName.length < 2 || cleanName.length > 80) {
    return res.status(400).json({ error: "Name must be between 2 and 80 characters." });
  }
  const messageWordCount = cleanMessage ? cleanMessage.split(/\s+/).filter(Boolean).length : 0;
  if (cleanMessage.length < 10 || messageWordCount > 250 || cleanMessage.length > 2000) {
    return res.status(400).json({ error: "Postcard message must be at least 10 characters and no more than 250 words." });
  }
  if (cleanRole.length > 120) {
    return res.status(400).json({ error: "Role/organisation is too long." });
  }
  if (cleanBeat.length > 40) {
    return res.status(400).json({ error: "Starting prompt value is too long." });
  }
  if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return res.status(400).json({ error: "That email address doesn't look valid." });
  }
  if (cleanType === "video" && !/^https?:\/\/.+/i.test(cleanVideoUrl)) {
    return res.status(400).json({ error: "Video postcards need a valid video link starting with http:// or https://." });
  }

  const editToken = crypto.randomBytes(24).toString("hex");
  const postcard = {
    id: crypto.randomUUID(),
    name: cleanName,
    role: cleanRole,
    beat: cleanBeat,
    type: cleanType,
    videoUrl: cleanType === "video" ? cleanVideoUrl : "",
    email: cleanEmail,
    message: cleanMessage,
    status: "pending",
    editTokenHash: sha256(editToken),
    createdAt: new Date().toISOString(),
    approvedAt: null,
  };

  try {
    await db.insertPostcard(postcard);
  } catch (err) {
    console.error("[db] insertPostcard failed:", err.message);
    return res.status(503).json({ error: "Could not save your postcard right now. Please try again shortly." });
  }
  notifyAdmin(postcard); // fire-and-forget — don't block the response on email delivery

  res.status(201).json({ id: postcard.id, editToken, status: postcard.status });
});

// Public wall feed: approved postcards for everyone, plus the caller's own
// pending/rejected postcards if they present valid edit tokens for them.
app.get("/api/postcards", async (req, res) => {
  try {
    const tokens = parseEditTokens(req);
    const all = await db.getAllPostcards();

    const result = all
      .filter((p) => {
        if (p.status === "approved") return true;
        const token = tokens.get(p.id);
        return token && safeEqual(sha256(token), p.editTokenHash);
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((p) => {
        const token = tokens.get(p.id);
        const mine = !!token && safeEqual(sha256(token), p.editTokenHash);
        return publicShape(p, mine ? { mine: true } : {});
      });

    res.json({ postcards: result });
  } catch (err) {
    console.error("[db] getAllPostcards failed:", err.message);
    res.status(503).json({ error: "Could not load the wall right now. Please try again shortly." });
  }
});

// Admin-only: full moderation queue, including submitter email.
app.get("/api/postcards/pending", async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: "Admin password required." });
  try {
    const all = await db.getAllPostcards();
    const pending = all
      .filter((p) => p.status === "pending")
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map(adminShape);
    res.json({ postcards: pending });
  } catch (err) {
    console.error("[db] getAllPostcards (pending) failed:", err.message);
    res.status(503).json({ error: "Could not load the moderation queue right now. Please try again shortly." });
  }
});

// Admin-only: approve a pending postcard so it appears on the public wall.
app.post("/api/postcards/:id/approve", async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: "Admin password required." });
  try {
    const postcard = await db.findPostcard(req.params.id);
    if (!postcard) return res.status(404).json({ error: "Postcard not found." });
    const updated = await db.updatePostcard(postcard.id, { status: "approved", approvedAt: new Date().toISOString() });
    res.json({ postcard: adminShape(updated) });
  } catch (err) {
    console.error("[db] approve failed:", err.message);
    res.status(503).json({ error: "Could not approve that postcard right now. Please try again shortly." });
  }
});

// Admin-only: reject a pending postcard (kept, marked rejected, never goes public).
app.post("/api/postcards/:id/reject", async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: "Admin password required." });
  try {
    const postcard = await db.findPostcard(req.params.id);
    if (!postcard) return res.status(404).json({ error: "Postcard not found." });
    const updated = await db.updatePostcard(postcard.id, { status: "rejected" });
    res.json({ postcard: adminShape(updated) });
  } catch (err) {
    console.error("[db] reject failed:", err.message);
    res.status(503).json({ error: "Could not reject that postcard right now. Please try again shortly." });
  }
});

// Delete — allowed for the admin team (x-admin-password) or the original
// author (x-edit-token matching the token they were issued at submission).
// Everyone else gets 403: read-only for the general public, by design.
app.delete("/api/postcards/:id", async (req, res) => {
  try {
    const postcard = await db.findPostcard(req.params.id);
    if (!postcard) return res.status(404).json({ error: "Postcard not found." });

    if (isAdmin(req)) {
      await db.deletePostcard(postcard.id);
      return res.json({ deleted: true, by: "admin" });
    }

    const suppliedToken = req.get("x-edit-token") || "";
    if (suppliedToken && safeEqual(sha256(suppliedToken), postcard.editTokenHash)) {
      await db.deletePostcard(postcard.id);
      return res.json({ deleted: true, by: "author" });
    }

    return res.status(403).json({ error: "Only the original author or the admin team can remove this postcard." });
  } catch (err) {
    console.error("[db] delete failed:", err.message);
    res.status(503).json({ error: "Could not remove that postcard right now. Please try again shortly." });
  }
});

// Last-resort safety net: catches anything that still slips past the
// try/catch blocks above (a bug in a route, a bad JSON body, etc.) and
// returns a normal error response instead of letting Express crash the
// process or hang the connection.
app.use((err, req, res, next) => {
  console.error("[unhandled] request error:", err && err.message ? err.message : err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: "Something went wrong on our end. Please try again shortly." });
});

// Extra safety net at the process level — logs instead of silently dying.
// The try/catch blocks above should catch everything already; this just
// guards against anything unexpected slipping through (a third-party
// library throwing outside a request, for example).
process.on("unhandledRejection", (reason) => {
  console.error("[process] unhandled promise rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[process] uncaught exception:", err);
});

app.listen(PORT, () => {
  console.log(`uPull Postcards API listening on port ${PORT}`);
});
