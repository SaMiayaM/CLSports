/**
 * POST /api/payments/create
 * Secure server-side payment creation.
 * - Validates orderItems, computes amount_cents server-side (USD)
 * - Never trusts amount from client
 * - Uses Square Payments API CreatePayment with server-generated idempotency key
 * - Redacts tokens from logs
 * - Persists payment/order
 *
 * Also available at /api/square/create-payment for backwards compatibility.
 */
import { getSquareClient, getSquareLocationId, getSquareEnvironment } from "../_lib/square.js";
import { validateOrderItems, computeTotalCents } from "../_lib/pricing.js";
import { savePayment, redactForLog } from "../_lib/db.js";
import { randomUUID } from "crypto";

function setCors(res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function json(res: any, status: number, body: any) {
  res.status(status).json(body);
}

function getClientIp(req: any): string | undefined {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    (req.headers["x-real-ip"] as string) ||
    req.socket?.remoteAddress
  );
}

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

  // ── Parse body safely (support both parsed and raw) ──
  let body: any = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body ?? {};

  const { sourceId, currency = "USD", orderItems, orderReference, locationId: clientLocationId } = body;

  // ── Env guards ──
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  if (!accessToken) {
    // Do not leak env names to client in prod; generic message
    console.error("[payments/create] missing SQUARE_ACCESS_TOKEN (SQUARE_ENVIRONMENT=" + getSquareEnvironment() + ")");
    return json(res, 500, { error: "Payment service not configured" });
  }

  let locationId: string;
  try {
    // Prefer clientLocationId only if it matches server location (for multi-location safety you would verify against DB)
    // For single-location setup, ignore client and use server env.
    locationId = getSquareLocationId();
    if (clientLocationId && clientLocationId !== locationId) {
      console.warn("[payments/create] ignoring client-supplied locationId", redactForLog({ clientLocationId }));
    }
  } catch (e: any) {
    console.error("[payments/create] location config error", e?.message);
    return json(res, 500, { error: "Payment service not configured" });
  }

  if (!sourceId || typeof sourceId !== "string" || sourceId.length < 4) {
    return json(res, 400, { error: "Missing payment token. Please re-enter card details." });
  }
  if (String(currency).toUpperCase() !== "USD") {
    return json(res, 400, { error: "Only USD is supported" });
  }

  // ── Validate & compute pricing server-side ──
  const validation = validateOrderItems(orderItems);
  if (!validation.valid) {
    return json(res, 400, { error: validation.error });
  }
  const validItems = validation.items;
  const amountCents = computeTotalCents(validItems);
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    return json(res, 400, { error: "Invalid order total" });
  }

  // Optional: compare client-provided amount if sent (for UI debugging), but do NOT use it
  if (body.amount !== undefined) {
    const clientCents = Math.round(Number(body.amount) * 100);
    if (Number.isFinite(clientCents) && clientCents !== amountCents) {
      console.warn(
        "[payments/create] client amount mismatch — ignoring client value",
        redactForLog({ expectedCents: amountCents, clientCents })
      );
      // Do not fail — use server value. Could optionally return 400 for strict mode.
    }
  }

  // TODO: authenticated user / order data — plug in your auth here
  // e.g. const user = await getUserFromRequest(req); if (!user) return json(res, 401, { error: "Unauthorized" });
  // For single-business shop, orderReference can be cart hash; for auth, use userId + orderId.
  const safeOrderReference = typeof orderReference === "string" ? orderReference.slice(0, 200) : undefined;
  const orderId = safeOrderReference || `order_${Date.now()}_${randomUUID().slice(0, 8)}`;

  const idempotencyKey = randomUUID();
  const referenceId = orderId; // Square referenceId maps to our order

  // ── Call Square — redacted logging ──
  // Never log sourceId / token
  console.log("[payments/create] creating payment", {
    orderId,
    amountCents,
    currency: "USD",
    locationId,
    environment: getSquareEnvironment(),
    idempotencyKey,
    itemCount: validItems.length,
  });

  try {
    const client = getSquareClient();
    const { result, statusCode } = await (client as any).payments.create({
      sourceId,
      idempotencyKey,
      locationId,
      amountMoney: {
        amount: BigInt(amountCents),
        currency: "USD",
      },
      referenceId,
      note: `CL Sports Club order ${orderId}`,
      // Optional: buyerEmailAddress / billingAddress / verificationToken passthrough
    });

    // Square SDK may return result.payment; fallback to fetch-style
    const payment = (result as any)?.payment ?? result;
    const squarePaymentId: string | undefined = payment?.id;
    const squareStatus: string = payment?.status ?? "UNKNOWN";

    // Persist (idempotent on idempotencyKey)
    await savePayment({
      idempotencyKey,
      orderId,
      squarePaymentId,
      status: squareStatus,
      amountCents,
      currency: "USD",
      items: validItems,
      rawResponse: payment, // in prod, consider stripping sensitive fields before persisting
    });

    // Return sanitized response — do not echo token
    // Square returns many fields; we expose minimal safe subset
    // On success, statusCode is 200; Square may return CARD_DECLINED etc. as 200 with payment.status details;
    // errors throw and are handled below.
    return json(res, statusCode || 200, {
      ok: true,
      orderId,
      paymentId: squarePaymentId,
      status: squareStatus,
      amountCents,
      currency: "USD",
      // include full payment for frontend convenience but redacted
      payment: payment ? { id: payment.id, status: payment.status, amountMoney: payment.amountMoney, referenceId: payment.referenceId, createdAt: payment.createdAt } : undefined,
    });
  } catch (err: any) {
    // Square SDK throws ApiError with body.errors — map to generic user message, redact internals
    const raw = err?.body ?? err?.result ?? err?.message ?? err;
    console.error("[payments/create] square error", redactForLog({ error: raw, orderId, amountCents }));
    const squareErrors: any[] = err?.body?.errors || err?.errors || [];
    const firstCode = squareErrors[0]?.code || "";
    const firstDetail = squareErrors[0]?.detail || "";

    // Never expose raw detail to customer; map to safe categories
    let userMessage = "Payment failed. Please try again with a different card or contact support.";
    let httpStatus = 400;
    if (firstCode === "CARD_DECLINED" || /declined/i.test(firstDetail)) {
      userMessage = "Card was declined. Please try a different card.";
      httpStatus = 402;
    } else if (firstCode === "INSUFFICIENT_FUNDS") {
      userMessage = "Insufficient funds. Please try a different card.";
      httpStatus = 402;
    } else if (firstCode === "CVV_FAILURE" || firstCode === "INVALID_CARD_DATA") {
      userMessage = "Card details were invalid. Please check and try again.";
      httpStatus = 400;
    } else if (firstCode === "VERIFY_CVV_FAILURE" || firstCode === "VERIFY_AVS_FAILURE") {
      userMessage = "Card verification failed. Please try a different card.";
      httpStatus = 400;
    } else if (err?.statusCode === 429) {
      userMessage = "Too many attempts. Please wait a moment and try again.";
      httpStatus = 429;
    } else if (err?.statusCode >= 500) {
      userMessage = "Payment service temporarily unavailable. Please try again.";
      httpStatus = 502;
    }

    // Persist failed attempt as well (optional)
    try {
      await savePayment({
        idempotencyKey,
        orderId,
        status: "FAILED",
        amountCents,
        currency: "USD",
        items: validItems,
        rawResponse: { error: firstCode, detail: "[REDACTED]" },
      });
    } catch {}

    return json(res, httpStatus, {
      ok: false,
      error: userMessage,
      code: firstCode || undefined,
      // do not include raw Square payload
    });
  }
}
