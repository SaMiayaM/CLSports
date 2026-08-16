/**
 * Minimal persistence layer for orders / payments / webhook events.
 * Replace in-memory Maps with Postgres queries when DATABASE_URL is set.
 *
 * Postgres schema (run once):
 *
 *   CREATE TABLE IF NOT EXISTS orders (
 *     id TEXT PRIMARY KEY,
 *     created_at TIMESTAMPTZ DEFAULT NOW(),
 *     items JSONB NOT NULL,
 *     amount_cents INT NOT NULL,
 *     currency TEXT NOT NULL DEFAULT 'USD',
 *     status TEXT NOT NULL,
 *     square_payment_id TEXT
 *   );
 *   CREATE TABLE IF NOT EXISTS payments (
 *     id TEXT PRIMARY KEY,
 *     order_id TEXT REFERENCES orders(id),
 *     square_payment_id TEXT UNIQUE,
 *     status TEXT,
 *     amount_cents INT,
 *     currency TEXT,
 *     idempotency_key TEXT UNIQUE,
 *     raw_response JSONB,
 *     created_at TIMESTAMPTZ DEFAULT NOW(),
 *     updated_at TIMESTAMPTZ DEFAULT NOW()
 *   );
 *   CREATE TABLE IF NOT EXISTS webhook_events (
 *     event_id TEXT PRIMARY KEY,
 *     type TEXT,
 *     payload JSONB,
 *     created_at TIMESTAMPTZ DEFAULT NOW()
 *   );
 *
 * To switch to Postgres, implement query helper below using `pg`:
 *   import { Pool } from 'pg';
 *   const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }});
 *   export async function query(text, params) { return pool.query(text, params); }
 */

type PaymentRecord = {
  id: string; // our id / idempotencyKey
  orderId: string;
  squarePaymentId?: string;
  status: string;
  amountCents: number;
  currency: string;
  idempotencyKey: string;
  items: any[];
  createdAt: string;
  updatedAt: string;
};

type WebhookEventRecord = {
  eventId: string;
  type: string;
  payload: any;
  createdAt: string;
};

// In-memory fallback (process-local). On Netlify Functions, each invocation may be isolated;
// for production, replace with Postgres.
const payments = new Map<string, PaymentRecord>();
const idempotencyToPaymentId = new Map<string, string>();
const webhookEvents = new Map<string, WebhookEventRecord>();
const squarePaymentIdToRecordId = new Map<string, string>();

export async function savePayment(params: {
  idempotencyKey: string;
  orderId: string;
  squarePaymentId?: string;
  status: string;
  amountCents: number;
  currency: string;
  items: any[];
  rawResponse?: any;
}): Promise<PaymentRecord> {
  // If pg is configured, you would INSERT ... ON CONFLICT(idempotency_key) DO NOTHING / RETURNING *
  // Here we emulate idempotency storage.
  const existingId = idempotencyToPaymentId.get(params.idempotencyKey);
  if (existingId) {
    const existing = payments.get(existingId);
    if (existing) return existing;
  }

  const now = new Date().toISOString();
  const id = params.squarePaymentId || `pay_${params.idempotencyKey.slice(0, 8)}_${Date.now()}`;
  const rec: PaymentRecord = {
    id,
    orderId: params.orderId,
    squarePaymentId: params.squarePaymentId,
    status: params.status,
    amountCents: params.amountCents,
    currency: params.currency,
    idempotencyKey: params.idempotencyKey,
    items: params.items,
    createdAt: now,
    updatedAt: now,
  };
  payments.set(id, rec);
  idempotencyToPaymentId.set(params.idempotencyKey, id);
  if (params.squarePaymentId) squarePaymentIdToRecordId.set(params.squarePaymentId, id);

  // Example Postgres (uncomment when ready):
  // await query(
  //   `INSERT INTO payments (id, order_id, square_payment_id, status, amount_cents, currency, idempotency_key, raw_response)
  //    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
  //    ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`,
  //   [id, params.orderId, params.squarePaymentId || null, params.status, params.amountCents, params.currency, params.idempotencyKey, params.rawResponse ? JSON.stringify(params.rawResponse) : null]
  // );

  return rec;
}

export async function updatePaymentBySquareId(squarePaymentId: string, patch: Partial<PaymentRecord> & { status?: string }): Promise<PaymentRecord | null> {
  const id = squarePaymentIdToRecordId.get(squarePaymentId);
  if (!id) return null;
  const rec = payments.get(id);
  if (!rec) return null;
  const updated = { ...rec, ...patch, updatedAt: new Date().toISOString() };
  payments.set(id, updated);
  return updated;
}

export async function isWebhookEventProcessed(eventId: string): Promise<boolean> {
  return webhookEvents.has(eventId);
}

export async function markWebhookEventProcessed(eventId: string, type: string, payload: any): Promise<void> {
  webhookEvents.set(eventId, { eventId, type, payload, createdAt: new Date().toISOString() });
  // Postgres: INSERT INTO webhook_events(event_id, type, payload) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING
}

export function redactForLog(obj: any) {
  if (!obj || typeof obj !== "object") return obj;
  const clone = JSON.parse(JSON.stringify(obj));
  const redactKeys = ["sourceId", "source_id", "token", "cardToken", "accessToken", "SQUARE_ACCESS_TOKEN", "signatureKey", "SQUARE_WEBHOOK_SIGNATURE_KEY"];
  function walk(o: any) {
    for (const k of Object.keys(o)) {
      if (redactKeys.includes(k) || k.toLowerCase().includes("token") || k.toLowerCase().includes("secret")) {
        o[k] = "[REDACTED]";
      } else if (o[k] && typeof o[k] === "object") walk(o[k]);
    }
  }
  walk(clone);
  return clone;
}
