# Square Payments — Secure GitHub → Netlify Setup (USD, Sandbox → Production)

> **Stack detected:** Vite + React + `@square/web-sdk` • API routes compatible with **Vercel & Netlify** • Postgres-ready persistence • Single business (CL Sports Club) • Currency: **USD** • Mode: **Sandbox first, then Production**

---

## 0) How this satisfies every security rule

| Rule | Where enforced |
|---|---|
| **1. Inspect project first** | Build is Vite (`vite.config.ts`), frontend in `src/app/`, API in `api/`, previously alias `/api/square/create-payment.ts`. Kept alias + added canonical `/api/payments/create` |
| **2. Official Web Payments SDK** | `src/app/components/payments/SquareCheckout.tsx` uses `import * as Square from "@square/web-sdk"` → `Square.payments(appId, locationId)` → `payments.card()` → `card.attach()` → `card.tokenize()` (current SDK v2 pattern, not legacy SqPaymentForm) |
| **3. Server-only `CreatePayment`** | Browser **never** calls Square. Browser tokenizes → `POST /api/payments/create` (or alias `/api/square/create-payment`) → server does `SquareClient.payments.create()` with `SQUARE_ACCESS_TOKEN` |
| **4. Frontend may use only** `VITE_SQUARE_APPLICATION_ID`, `VITE_SQUARE_LOCATION_ID` | Only `import.meta.env.VITE_SQUARE_*` in `SquareCheckout`, `CartDrawer`, `SquarePayment`. Grep shows no secrets in `src/` |
| **5. Never expose to browser** `SQUARE_ACCESS_TOKEN`, `SQUARE_WEBHOOK_SIGNATURE_KEY`, OAuth secrets, DB URL | These live only in `api/_lib/square.ts` + `api/payments/create.ts` + `api/webhooks/square.ts` and Netlify Functions. Never prefixed with `VITE_` |
| **6. Do not commit secrets** | `.gitignore` blocks `.env*`. Only `.env.example` (names, fake values) is committed |
| **7. `.env.example` + `.gitignore` + platform docs** | See §2–§4 below; Netlify Dashboard encrypted vars documented |
| **8. Encrypted platform vars** | Netlify: Site settings → Environment variables. GitHub Actions: Settings → Secrets and variables → Actions |
| **9. Backend route validates & computes server-side** | `api/_lib/pricing.ts` → `validateOrderItems()` + `computeTotalCents()` (Adult 3500¢, Kids 2500¢). Ignores client `amount`. Uses `BigInt(amountCents)` + `randomUUID()` idempotency + `savePayment()` + redacted logs |
| **10. Frontend hardened** | Disabled button while `submitting`, generic mapped errors via `mapToUserMessage()`, success/declined/retry states, never shows `payload.errors[0].detail` raw |
| **11. Webhook POST /api/webhooks/square** | Raw body, `X-Square-HMACSHA256-Signature`, `verifySignature(payload = notificationUrl+rawBody, HMAC-SHA256)`, idempotent via `webhook_events` table, handles `payment.created/updated/refunded` |
| **12. Sandbox/Production split** | `SQUARE_ENVIRONMENT=sandbox|production`. Sandbox creds only locally + test deploys; Production creds only in Netlify Production env after Sandbox passes |
| **13. This file = deliverable** | You are reading it |
| **14. Current SDK patterns** | Server: `square@45` `SquareClient` + `SquareEnvironment.Sandbox/Production`. Client: `@square/web-sdk@2.2` `payments.card()` |

---

## 1) Install commands

```bash
# From repo root
npm i

# Square Server SDK + Netlify Functions types (already installed):
npm i square@^45.0.1 @netlify/functions

# Optional Postgres (when you wire real DB):
npm i pg
npm i -D @types/pg @types/node
```

Frontend already has `@square/web-sdk@^2.2.0` — do **not** add `square` to frontend bundle.

Verify build:

```bash
npm run build
# Vite should compile src/ → dist/
# Netlify Functions are bundled via esbuild automatically
```

---

## 2) `.env.example` contents (variable names only, no real values)

Create this file and commit it — copy to `.env` locally, never commit `.env`:

```ini
# ── Frontend (public, safe for browser via Vite) ──
# Vite requires VITE_ prefix to expose to client. These are NOT secrets.
VITE_SQUARE_APPLICATION_ID=sandbox-sq0idb-xxxxxxxxxxxxxxxxxxxxxx
VITE_SQUARE_LOCATION_ID=LXXXXXXXXXXXXXXXXXXXXX

# ── Backend (server-only, never expose to browser) ──
SQUARE_ENVIRONMENT=sandbox
SQUARE_APPLICATION_ID=sandbox-sq0idb-xxxxxxxxxxxxxxxxxxxxxx
SQUARE_LOCATION_ID=LXXXXXXXXXXXXXXXXXXXXX
SQUARE_ACCESS_TOKEN=EAAAExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SQUARE_WEBHOOK_SIGNATURE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ── App / Database ──
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
PUBLIC_SITE_URL=https://your-site.netlify.app
```

Actual file at repo root: `.env.example`

---

## 3) `.gitignore` additions (secret files excluded)

```gitignore
# Dependencies
node_modules
dist
.netlify
.vercel
out
build

# Env & secrets — never commit real credentials
.env
.env.local
.env.development.local
.env.production.local
.env.production
.env.test.local
*.env.local

# OS / editor
.DS_Store
Thumbs.db
.idea
.vscode

# Logs
npm-debug.log*
yarn-debug.log*
pnpm-debug.log*
logs
*.log
```

Actual file: `.gitignore` (already updated)

---

## 4) Hosting-platform env var setup — **Netlify** (encrypted)

1. Netlify Dashboard → Your site → **Site settings → Environment variables** → **Add variable**
2. Add **each** of these (copy names from `.env.example`, paste *real* Sandbox values for now):
   - `VITE_SQUARE_APPLICATION_ID`
   - `VITE_SQUARE_LOCATION_ID`
   - `SQUARE_ENVIRONMENT` = `sandbox`
   - `SQUARE_APPLICATION_ID` (same as Vite one, but server-only copy)
   - `SQUARE_LOCATION_ID` (same)
   - `SQUARE_ACCESS_TOKEN`
   - `SQUARE_WEBHOOK_SIGNATURE_KEY`
   - `DATABASE_URL` (optional for now; if empty, in-memory mock is used)
   - `PUBLIC_SITE_URL` = `https://<your-site>.netlify.app` (used for webhook signature URL)
3. **Scopes:**
   - For initial testing: set for **All scopes** (or at least **Builds, Functions, Runtime**)
   - After Sandbox passes, add **Production**-only values with same names but Production credentials — Netlify lets you set **Deploy contexts** (Production vs Preview vs Branch deploys). Use that to keep Sandbox in Preview and Production in Production.
4. **Redeploy** after saving (Deploys → Trigger deploy → Clear cache and deploy).
5. **Verify vars are NOT in `dist/` or client JS:** `npm run build && grep -r EAAA dist/ || echo "no secrets in build — good"`

### If you use GitHub Actions to deploy to Netlify:

Never hardcode secrets in `.github/workflows/*.yml`. Instead:

```yaml
# .github/workflows/deploy.yml (example)
name: Deploy
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run build
        env:
          VITE_SQUARE_APPLICATION_ID: ${{ secrets.VITE_SQUARE_APPLICATION_ID }}
          VITE_SQUARE_LOCATION_ID: ${{ secrets.VITE_SQUARE_LOCATION_ID }}
      # Netlify CLI deploy will read server secrets from Netlify, not GitHub

      # If you must pass a server secret to an action, use GitHub Secrets:
      # env:
      #   SQUARE_ACCESS_TOKEN: ${{ secrets.SQUARE_ACCESS_TOKEN }}
```

Create those via **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**. Verify workflow file contains no literal token.

---

## 5) Square Developer Dashboard setup (start Sandbox, then Production)

### A. Create app

1. Go to **https://developer.squareup.com/apps** → **Open Developer Dashboard** → **Create App** (or use existing)
2. Name: `CL Sports Club` (any)
3. You now have two tabs: **Sandbox** and **Production**. You will configure **Sandbox first**.

### B. Sandbox credentials

1. In Dashboard, toggle to **Sandbox** (top-left)
2. **Credentials** → **Sandbox Access Token** → copy → will become `SQUARE_ACCESS_TOKEN` (Sandbox)
3. **App ID** (starts `sandbox-sq0idb-...`) → `SQUARE_APPLICATION_ID` + `VITE_SQUARE_APPLICATION_ID` (Sandbox)
4. **Locations** → **Sandbox Test Account** → open Location → **ID** (starts `L...`) → `SQUARE_LOCATION_ID` + `VITE_SQUARE_LOCATION_ID`
   - Create a location if none; ensure currency **USD** and country **US**.
5. Keep Dashboard open for webhook step after you deploy.

### C. Webhook (do after first deploy has HTTPS URL)

1. Deploy to Netlify (even a preview) to get `https://<your-site>.netlify.app`
2. Dashboard → **Webhooks** → **Add Subscription**
   - **Notification URL:** `https://<your-site>.netlify.app/api/webhooks/square`  (also works as `/.netlify/functions/square-webhook` via redirect; use the `/api` form)
   - **API Version:** leave default (e.g., `2025-07-16` — should match `Square-Version` header in server code)
   - **Events:** check `payment.created`, `payment.updated`, `refund.created`, `refund.updated` (and `payment.refunded` if shown)
   - Save → Dashboard shows **Signature Key** (sometimes called **Webhook Signature Key**) → copy → set as `SQUARE_WEBHOOK_SIGNATURE_KEY` in Netlify env vars → Redeploy
3. Click **Test** or **Send Test Event** if available; verify Netlify Function logs show `[webhook/square] verified event`.

> **Why deployed HTTPS URL?** Square HMAC is `base64(HMAC-SHA256( notificationUrl + rawBody, signatureKey ))`. `notificationUrl` must exactly match the subscription URL. Using `PUBLIC_SITE_URL` env ensures server computes same URL even behind Netlify proxy.

### D. Production (only after Sandbox tests pass)

1. In Dashboard, switch to **Production** tab → **Credentials** → you will need to **complete Square account onboarding/verification** (business info, bank account) to get Production token.
2. Production **Application ID** (starts `sq0idp-...`) and **Access Token** (starts `EAAA...`) and **Location ID** (live location) → add to **Netlify Production context** env vars (keep Sandbox in Preview context).
3. Flip `SQUARE_ENVIRONMENT=production` in Netlify **Production** context only.
4. In Production, create webhook subscription again (same URL, but Production events).

---

## 6) Exact file-by-file code changes

### 6.1 `.env.example` — NEW
Variable names only, fake placeholders. See §2.

### 6.2 `.gitignore` — UPDATED
Now excludes `.env`, `.env.local`, `.env.production`, `.netlify`, `dist`, etc. See §3.

### 6.3 `netlify.toml` — NEW
```toml
[build]
  command = "npm run build"
  publish = "dist"
[build.environment]
  NODE_VERSION = "20"
[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"
[[redirects]]
  from = "/api/payments/create"
  to = "/.netlify/functions/create-payment"
  status = 200
  force = true
[[redirects]]
  from = "/api/square/create-payment"
  to = "/.netlify/functions/create-payment"
  status = 200
  force = true
[[redirects]]
  from = "/api/webhooks/square"
  to = "/.netlify/functions/square-webhook"
  status = 200
  force = true
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
[dev]
  command = "npm run dev"
  port = 5173
  targetPort = 5173
```
*Explains:* Frontend is SPA (fallback to `index.html`), `/api/*` are rewritten to Functions so frontend can call clean REST paths.

### 6.4 `api/_lib/square.ts` — NEW (server-only helper)
```ts
// Wraps SquareClient(SQUARE_ACCESS_TOKEN, SquareEnvironment.Sandbox|Production)
// Exports getSquareClient(), getSquareLocationId(), getWebhookSignatureKey(), getWebhookNotificationUrl(req)
```
*Why:* Single place to enforce `SQUARE_ENVIRONMENT` split, never import in frontend.

### 6.5 `api/_lib/pricing.ts` — NEW
```ts
priceCentsForCategory("Adult")→3500, ("Kids")→2500
validateOrderItems(orderItems) // checks category, integer qty 1..99
computeTotalCents(items) // server-authoritative sum
```
*Why:* Loads product prices from server/DB; ignores client `price`. Extend to `SELECT price FROM products WHERE id=?` for DB catalog.

### 6.6 `api/_lib/db.ts` — NEW (mock → Postgres)
In-memory Maps for `payments`, `webhook_events` with `savePayment()`, `updatePaymentBySquareId()`, `isWebhookEventProcessed()`, `markWebhookEventProcessed()`, `redactForLog()`.
Includes commented `CREATE TABLE` SQL for Postgres:
```sql
CREATE TABLE IF NOT EXISTS orders (...);
CREATE TABLE IF NOT EXISTS payments (id TEXT PRIMARY KEY, order_id TEXT, square_payment_id TEXT UNIQUE, status TEXT, amount_cents INT, currency TEXT, idempotency_key TEXT UNIQUE, raw_response JSONB, ...);
CREATE TABLE IF NOT EXISTS webhook_events (event_id TEXT PRIMARY KEY, type TEXT, payload JSONB);
```
*Why:* Satisfies “save Square payment ID, order ID, status, timestamps” + idempotency (store `event_id` and `idempotency_key`). Replace with `pg` Pool when `DATABASE_URL` set.

### 6.7 `api/payments/create.ts` — NEW (canonical route)
**Before:** `api/square/create-payment.ts` was ad-hoc `fetch` to Square, accepted `amount` from client, basic price check.
**After:** Hardened handler:
- `OPTIONS` CORS ok, `POST` only
- Requires `sourceId` (token), `orderItems`; rejects non-USD
- `validateOrderItems` + `computeTotalCents` → `amountCents` (cents, `Math.round` not needed because already integer)
- Generates `idempotencyKey = randomUUID()`, `orderId = orderReference || order_${uuid}`
- **Ignores** client `amount` if mismatched (logs warning, uses server value)
- Calls `SquareClient.payments.create({ sourceId, idempotencyKey, locationId, amountMoney: { amount: BigInt(amountCents), currency:"USD" }, referenceId: orderId, note })`
- Logs redacted (`redactForLog`), never logs token
- On success: `savePayment()` + return `{ ok:true, paymentId, status, amountCents, payment:{id,status,amountMoney} }` (no token)
- On error: map Square `code` → generic `userMessage` (declined→402, invalid→400, 429→retry, 5xx→502), save FAILED, return `{ ok:false, error:userMessage }`

### 6.8 `api/square/create-payment.ts` — UPDATED (alias)
```ts
import createPaymentHandler from "../payments/create.js";
export default (req,res)=> createPaymentHandler(req,res);
```
*Why:* Keep backwards compatibility for existing frontend defaults; same security.

### 6.9 `api/webhooks/square.ts` — NEW
- `config.api.bodyParser=false` (keep raw)
- `readRawBody(req)` (handles `req.body` string/Buffer/`rawBody`/stream)
- `verifySignature(rawBody, signatureHeader, notificationUrl, signatureKey)` → `HMAC-SHA256(notificationUrl+rawBody, key)` base64, timing-safe compare
- If invalid → 401; if missing event_id → 400
- Idempotency: `isWebhookEventProcessed(eventId)` → 200 duplicate
- Handles `payment.created`/`payment.updated` → `updatePaymentBySquareId(squarePaymentId, {status})`; `refund.created`/`payment.refunded` → update with `REFUNDED_*`
- `markWebhookEventProcessed(eventId, type, payload)` → 200
- On processing error → 500 so Square retries

### 6.10 `netlify/functions/create-payment.ts` — NEW
Netlify Function wrapper that translates `event { httpMethod, headers, body }` into shim `req/res` for the shared handler. Bundled via esbuild.

### 6.11 `netlify/functions/square-webhook.ts` — NEW
Same wrapper for webhook, handles `isBase64Encoded` and stream `on('data')` shim.

### 6.12 `src/app/components/payments/SquareCheckout.tsx` — REWRITTEN (hardened)
**Key changes vs previous:**
- Adds `orderReference` prop, `UiState = idle|submitting|success|declined|error`
- `mapToUserMessage()` — maps raw Square errors to safe copy, never exposes `detail`
- `payments.card()` still correct for `@square/web-sdk@2.2`
- `tokenize()` now checks `result.status !== "OK"` and `result.errors[0].message`; extracts `result.token` only on OK
- Sends **only** `{ sourceId, amount (display/debug), currency, orderItems, orderReference }` — no `locationId` from client needed (server uses env), no secret
- Disabled button `disabled={!isReady || isSubmitting}`, `aria-disabled`, `role="alert"` for errors, `role="status"` for success
- UI branches: `success` shows “Payment Confirmed” green, `declined` shows retry hint, `error` generic; button hidden on success
- No `console.log` of token; errors call `onError` with safe Error

### 6.13 `src/app/components/payments/CartDrawer.tsx` — UPDATED
- Now uses `useCart().clear()` and `didPay` state
- Generates `orderRef = cart_${Date.now()}` once
- Passes `orderItems` + `orderReference` to `SquareCheckout`
- Success callback `onSuccess(()=>setDidPay(true))` shows “Payment complete” + Clear cart
- Default endpoint changed to `/api/payments/create` (alias still works)
- Empty-cart guard + amount display

### 6.14 `src/app/components/payments/SquarePayment.tsx` — UPDATED
- Endpoint default now `/api/payments/create`
- Still reads only `VITE_SQUARE_*`, docs comment reminds never to expose access token

### 6.15 `src/app/App.tsx` — UPDATED (TrainingPage)
- Text changed from “connect it to a Vercel function” to “card data is tokenized … charge is created server-side via `POST /api/payments/create` with server-validated totals”
- `SquareCheckout` now receives `orderItems={[{ name:"Session Deposit", category:"Adult", … }]}` so server can compute (previously `orderItems` omitted)
- Endpoint updated to `/api/payments/create`

### 6.16 `index.html` — already correct (verified)
CSP already allows Square: `default-src 'self' https://*.squarecdn.com https://*.squareup.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.squarecdn.com ...; connect-src https://*.squareup.com; frame-src https://*.squarecdn.com` — required for Web Payments SDK iframe.

---

## 7) Sandbox test instructions (use before Production)

1. **Local env:** `cp .env.example .env` → fill **Sandbox** values (`SQUARE_ENVIRONMENT=sandbox`, `sandbox-sq0idb-...`, `L...`, `EAAA...` sandbox token, signature key from Sandbox webhook, `DATABASE_URL` optional).
2. **Netlify env:** Add same Sandbox values in Netlify Dashboard → Environment variables (All scopes) → **Trigger deploy**.
3. **Run locally with Netlify emulation (optional):**
   ```bash
   npx netlify-cli dev
   # Frontend at http://localhost:8888, Functions at /.netlify/functions/*
   ```
   Or `npm run dev` (frontend only) + test server via deployed preview URL.
4. **Shop flow:**
   - Open site → **Shop** → pick Tee/Tank → choose Adult/Kids + size → `Add to Cart`
   - Click cart icon → **Secure Checkout** should show `Loading secure payment form…` then `Card details are secured by Square.` (if not, check `VITE_SQUARE_*` in Netlify logs)
   - Use **Square Sandbox test cards** (https://developer.squareup.com/docs/devtools/sandbox/payments):
     - **Success:** `4111 1111 1111 1111` any future date, any CVV, any ZIP `12345` → should show “Payment successful!” + Netlify log `creating payment { amountCents, orderId }` (no token) + `savePayment` + return `{ ok:true, paymentId: "...", status:"COMPLETED" }`
     - **Declined:** `4000 0000 0000 0002` → UI should show “Card was declined. Please try a different card.” with retry (button stays enabled), not raw `CARD_DECLINED`
     - **CVV failure:** `4000 0000 0000 0127` or `4000 0000 0000 0069` → “Card details were invalid…”
     - **No cart:** submit with empty → “Your cart is empty.”
   - Verify server **recomputes total**: edit browser devtools `orderItems` price to `$1` and amount to `1.00` → server should still charge $35/$25 per item (check function log `client amount mismatch — ignoring`)
5. **Webhook test:**
   - In Square Dashboard → Sandbox → Webhooks → your subscription → **Send Test Event** (payment.created) → Netlify Function logs should show `[webhook/square] verified event { eventId, eventType }` and 200. Resend same event → logs `duplicate event, acking` (idempotent).
   - Trigger real payment (`4111...`) → Dashboard → Webhooks → Delivery logs should show 200 for `payment.created` and `payment.updated`.
   - To test signature failure: temporarily change `SQUARE_WEBHOOK_SIGNATURE_KEY` → next webhook should 401 `Invalid signature` (revert after).
6. **Check redaction:** `netlify functions:logs` or site logs should never contain `sourceId`, `token`, or `EAAA...` — only `[REDACTED]` and sanitized `payment:{id,status}`.
7. **Amount in cents:** For Adult $35, log `amountCents:3500`; for two Kids $25 each, `5000`. Confirm Square Dashboard shows same.

---

## 8) Production deployment checklist

- [ ] **Sandbox tests all green** (§7) — success, declined, invalid, webhook verified, duplicate ack, redaction, cents.
- [ ] **Switch credentials:**
  - Netlify Dashboard → Environment variables → set **Production context** values:
    - `SQUARE_ENVIRONMENT=production`
    - `VITE_SQUARE_APPLICATION_ID=sq0idp-...` (Production App ID)
    - `VITE_SQUARE_LOCATION_ID=L...` (live location, USD)
    - `SQUARE_APPLICATION_ID=sq0idp-...`
    - `SQUARE_LOCATION_ID=L...`
    - `SQUARE_ACCESS_TOKEN=EAAA...` (Production token)
    - `SQUARE_WEBHOOK_SIGNATURE_KEY=...` (Production webhook key)
    - `PUBLIC_SITE_URL=https://<your-prod-domain>` (must be HTTPS, no trailing slash; if custom domain, update webhook URL too)
    - `DATABASE_URL` (Production Postgres)
  - Ensure **Preview/Branch** contexts still use Sandbox (so PR previews don’t charge real cards).
- [ ] **Square Production app approved:** Business verification complete, bank account linked, Production token enabled.
- [ ] **Webhook Production subscription:** In Dashboard (Production tab) → Webhooks → Add Subscription → `https://<your-prod-domain>/api/webhooks/square` → select `payment.created`, `payment.updated`, `refund.created`, `refund.updated` → copy Signature Key → update Netlify Production var.
- [ ] **Trigger Production deploy:** Deploys → Trigger deploy → Clear cache and deploy → check build logs show no secret leaks.
- [ ] **Verify Production HTTPS:** `curl -I https://<your-prod-domain>/api/webhooks/square` should not expose secrets, should 405 on GET, 401 on POST without signature.
- [ ] **Test live with real card $1 auth then refund:** Use real card small charge (or $1 test if Square allows live test), verify `payment.created` → status `COMPLETED` in DB, then refund in Dashboard → verify `payment.refunded` updates record.
- [ ] **Confirm idempotency:** Double-click Pay quickly → only one Square payment (second request uses new idempotency key but same cart; check `idempotencyKey` uniqueness per attempt is correct, and retry with same `sourceId` after failure uses new key — expected).
- [ ] **Logs & monitoring:** Enable Netlify Log Drains or check Functions logs for `[payments/create] square error` without tokens; ensure `redactForLog` active.
- [ ] **Remove Sandbox vars from Production:** Do not leave `sandbox-` tokens in Production context.
- [ ] **Update CSP if domain changes:** If using custom domain, CSP in `index.html` already covers `*.squarecdn.com` — no change needed.
- [ ] **Git hygiene:** `git status` should not show `.env` or `.env.production`; `git log -p | grep -i EAAA` should be empty; `.env.example` still has placeholders only.
- [ ] **Document for team:** Share this file + env var names (not values) + who has Dashboard access.

---

## 9) Local development (Vite) env setup

Create `.env` (never commit):
```bash
cp .env.example .env
# then edit .env with Sandbox values — Vite will expose only VITE_*
```

Run:
```bash
npm run dev          # http://localhost:5173 (Square SDK needs HTTPS for some features, but Sandbox works on localhost)
npx netlify dev      # Full stack with Functions on :8888 (recommended)
```

---

## 10) Postgres wiring (when you add DB)

1. Install `pg` as above.
2. Replace `api/_lib/db.ts` in-memory Maps with:
```ts
import { Pool } from 'pg';
export const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }});
export const query = (t:string,p:any[])=> pool.query(t,p);
```
3. Run the `CREATE TABLE` statements from §6.6 (or migrations).
4. In `savePayment`, `updatePaymentBySquareId`, `isWebhookEventProcessed` replace Map logic with `INSERT ... ON CONFLICT DO NOTHING` / `SELECT` queries.
5. Add `DATABASE_URL` to Netlify env (use Neon/Supabase/Netlify DB).

---

## 11) File tree (new/updated)

```
.env.example                    (new — names only)
.gitignore                      (updated — exclude .env, .netlify, dist)
netlify.toml                    (new — build + redirects)
api/_lib/square.ts              (new — SquareClient factory, env split)
api/_lib/pricing.ts             (new — server pricing, never trust client)
api/_lib/db.ts                  (new — persistence + redaction, Postgres-ready)
api/payments/create.ts          (new — canonical secure handler)
api/square/create-payment.ts    (updated — alias to canonical)
api/webhooks/square.ts          (new — verified webhook, idempotent)
netlify/functions/create-payment.ts   (new — Netlify wrapper)
netlify/functions/square-webhook.ts   (new — Netlify wrapper)
src/app/components/payments/SquareCheckout.tsx  (rewritten — hardened)
src/app/components/payments/CartDrawer.tsx      (updated — orderReference, success state)
src/app/components/payments/SquarePayment.tsx   (updated — endpoint)
src/app/App.tsx                                 (updated — TrainingPage now sends orderItems)
```

---

## 12) Quick reference — official docs

- Web Payments SDK: https://developer.squareup.com/docs/web-payments/overview
- Payments API CreatePayment: https://developer.squareup.com/reference/square/payments-api/create-payment
- Node SDK (square@45): https://developer.squareup.com/docs/sdks/nodejs/quick-start
- Sandbox test cards: https://developer.squareup.com/docs/devtools/sandbox/payments (search “Test card numbers”)
- Webhooks verify signature: https://developer.squareup.com/docs/webhooks/step3validate
- Netlify Environment variables: https://docs.netlify.com/environment-variables/overview/
- Vite env vars: https://vitejs.dev/guide/env-and-mode (must prefix `VITE_`)

---

## 13) Support & next steps

- Mulit-restaurant OAuth (if you later need it): requires `OAuth client secret` stored server-only, plus per-merchant tokens in DB, and per-location checkout — ask to extend `api/_lib/square.ts` to `getClientForMerchant(merchantId)`.
- Add authenticated user: in `api/payments/create.ts` uncomment `getUserFromRequest(req)` and store `userId` in `orders`/`payments`.
- Add taxes/discounts: modify `api/_lib/pricing.ts` `computeTotalCents()` to load rates from DB, apply before `BigInt()`.

Generated for branch `arena/01a00b55-clsports` on 2026-08-16.
