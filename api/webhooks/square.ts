/**
 * POST /api/webhooks/square
 * Square webhook receiver — must verify signature with raw body.
 *
 * Responsibilities:
 * - Use raw request body (required for HMAC verification)
 * - Verify X-Square-HMACSHA256-Signature against SQUARE_WEBHOOK_SIGNATURE_KEY
 * - Make processing idempotent by storing eventId (merchant_id + event_id)
 * - Handle payment.created, payment.updated, refund.created / payment.refunded
 * - Update order/payment status from verified events
 *
 * Square docs: https://developer.squareup.com/docs/webhooks/step3validate
 */
import { getWebhookSignatureKey, getWebhookNotificationUrl } from "../_lib/square.js";
import { isWebhookEventProcessed, markWebhookEventProcessed, updatePaymentBySquareId, redactForLog } from "../_lib/db.js";
import { createHmac } from "crypto";

function setCors(res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-square-hmacsha256-signature");
}

function json(res: any, status: number, body: any) {
  res.status(status).json(body);
}

async function readRawBody(req: any): Promise<string> {
  if (typeof req.body === "string") return req.body;
  if (Buffer.isBuffer(req.body)) return req.body.toString("utf8");
  if (req.body && typeof req.body === "object") {
    // If framework already parsed JSON, we lose raw bytes — for verification we need to reconstruct.
    // Square requires EXACT raw bytes. In that case fall back to rawBody if available, else JSON stringify.
    // Netlify/Vercel: check req.rawBody / event.body
    if (typeof req.rawBody === "string") return req.rawBody;
    return JSON.stringify(req.body);
  }
  // Stream fallback
  return await new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk: any) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function verifySignature({ rawBody, signatureHeader, notificationUrl, signatureKey }: {
  rawBody: string; signatureHeader: string; notificationUrl: string; signatureKey: string;
}): boolean {
  // Square: base64(HMAC-SHA256(notificationUrl + rawBody, signatureKey))
  // Some SDKs use WebhooksHelper. We implement directly for zero-dep accuracy.
  if (!signatureHeader || !rawBody || !signatureKey) return false;
  const payload = notificationUrl + rawBody;
  const hmac = createHmac("sha256", signatureKey).update(payload, "utf8").digest("base64");
  // Use timing-safe compare
  if (hmac.length !== signatureHeader.length) return false;
  let result = 0;
  for (let i = 0; i < hmac.length; i++) result |= hmac.charCodeAt(i) ^ signatureHeader.charCodeAt(i);
  return result === 0;
}

export const config = {
  api: {
    bodyParser: false, // Important: keep raw body for verification (Vercel/Next)
  },
};

export default async function handler(req: any, res: any) {
  setCors(res);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return json(res, 405, { error: "Method not allowed" });
  }

  const signatureHeader = (req.headers["x-square-hmacsha256-signature"] as string) || "";
  if (!signatureHeader) {
    console.warn("[webhook/square] missing signature header");
    return json(res, 400, { error: "Missing signature" });
  }

  let signatureKey: string;
  try {
    signatureKey = getWebhookSignatureKey();
  } catch (e: any) {
    console.error("[webhook/square] webhook key not configured");
    return json(res, 500, { error: "Webhook not configured" });
  }

  const rawBody = await readRawBody(req);
  const notificationUrl = getWebhookNotificationUrl(req);

  // Also support SDK helper path if available (non-throwing alternative already done above)
  const valid = verifySignature({ rawBody, signatureHeader, notificationUrl, signatureKey });
  if (!valid) {
    console.error("[webhook/square] signature verification failed", redactForLog({ notificationUrl }));
    return json(res, 401, { error: "Invalid signature" });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return json(res, 400, { error: "Invalid JSON" });
  }

  const eventId: string = event.event_id || event.eventId || event.id || "";
  const eventType: string = event.type || event.event_type || "";
  if (!eventId) {
    console.warn("[webhook/square] no eventId, rejecting", redactForLog(event));
    return json(res, 400, { error: "Missing event_id" });
  }

  // Idempotency: have we seen this event before?
  if (await isWebhookEventProcessed(eventId)) {
    console.log("[webhook/square] duplicate event, acking", { eventId, eventType });
    return json(res, 200, { ok: true, duplicate: true });
  }

  console.log("[webhook/square] verified event", { eventId, eventType, notificationUrl });

  try {
    // ── Handle supported events ──
    // Square payment webhook payload shapes vary by type; normalize
    const dataObj = event.data || {};
    const obj: any = dataObj.object || dataObj;
    // payment events carry payment object at data.object.payment
    const payment = obj.payment || obj;

    switch (eventType) {
      case "payment.created":
      case "payment.updated": {
        const squarePaymentId: string | undefined = payment?.id;
        const status: string | undefined = payment?.status;
        if (squarePaymentId && status) {
          await updatePaymentBySquareId(squarePaymentId, { status, squarePaymentId });
          console.log("[webhook/square] payment status updated", { squarePaymentId, status });
        }
        break;
      }
      case "refund.created":
      case "refund.updated":
      case "payment.refunded": {
        // refund events reference payment_id
        const refund = obj.refund || obj;
        const paymentId: string | undefined = refund?.payment_id || payment?.payment_id || payment?.id;
        const status: string | undefined = refund?.status || payment?.status;
        if (paymentId) {
          await updatePaymentBySquareId(paymentId, { status: status ? `REFUNDED_${status}` : "REFUNDED" });
          console.log("[webhook/square] refund recorded", { paymentId, status });
        }
        break;
      }
      default: {
        // Ack but log unknown types for future handling
        console.log("[webhook/square] unhandled event type, acking", { eventType });
        break;
      }
    }

    await markWebhookEventProcessed(eventId, eventType, event);

    // For Postgres, you would UPDATE orders/payments here within a transaction.

    return json(res, 200, { ok: true });
  } catch (e: any) {
    console.error("[webhook/square] processing error", e?.message, redactForLog({ eventId }));
    // Store event even on error to avoid reprocessing loops? Choose to NOT mark so Square will retry.
    // Return 500 so Square retries with backoff.
    return json(res, 500, { error: "Processing failed, will retry" });
  }
}
