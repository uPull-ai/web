# uPull Postcards Server

Backend API for the uPull.ai "Postcard From 2030" wall — a moderation queue,
author/admin-only delete, and a Web3Forms admin notification on every new
submission. Pairs with `postcards.html` on upull.ai, which already has a
two-mode toggle built in (`API_BASE_URL` near the top of its `<script>`
block) — leave it blank for local-only demo mode, or point it at this
server's deployed URL for a real shared wall everyone sees.

## Deploy to Render (free tier, no credit card, ~10 minutes)

1. This repo is already pushed to GitHub — you're looking at it.
2. At [render.com](https://render.com), sign in with GitHub, then **New →
   Web Service**, and point it at this repo. Leave **Root Directory** blank
   (this repo *is* the server root).
3. Build command: `npm install`. Start command: `npm start`.
4. Under **Environment**, add:
   - `ADMIN_PASSWORD` — pick something long and random. This is what
     unlocks the moderator panel on the live page.
   - `WEB3FORMS_ACCESS_KEY` — `8bdba7a3-9c31-46ef-a6e3-f985ac4337e2` (already
     wired into the postcards page for the demo-mode email notification —
     reuse it here, or swap in a dedicated key from web3forms.com).
   - `ALLOWED_ORIGIN` — `https://upull.ai` (lock this down; don't leave it
     as `*` once real).
   - `PORT` — leave unset; Render supplies its own.
5. Deploy. Once live, Render gives you a URL like
   `https://upull-postcards-server.onrender.com`.
6. In `postcards.html`, set:
   ```js
   const API_BASE_URL = 'https://upull-postcards-server.onrender.com';
   ```
   and redeploy the site. That one line switches the page from
   `localStorage` demo mode to this real, shared backend.

## Notes

- Storage is a flat JSON file (`data/postcards.json`), fine for a low-traffic
  campaign wall. Render's free tier has an ephemeral filesystem — the file
  survives restarts but not redeploys, so if the wall needs to persist
  through a redeploy, move `db.js` onto a real database (Postgres/Supabase)
  before then. Every other file only calls the functions `db.js` exports, so
  that's a contained swap.
- `.env` is gitignored on purpose — never commit real secrets. Copy
  `.env.example` to `.env` for local runs.
- API surface: `POST /api/postcards` (submit), `GET /api/postcards` (public
  feed), `GET /api/postcards/pending` + `POST /api/postcards/:id/approve` +
  `POST /api/postcards/:id/reject` (admin, via `x-admin-password` header),
  `DELETE /api/postcards/:id` (admin or original author via `x-edit-token`).
