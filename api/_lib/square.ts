/**
 * Square Server SDK helper — server-only.
 * Never import this file in frontend code.
 *
 * Uses official `square` Node SDK (v45+).
 * Env:
 *   SQUARE_ACCESS_TOKEN (required, server-only)
 *   SQUARE_ENVIRONMENT=sandbox|production (default sandbox)
 *
 * Docs: https://developer.squareup.com/docs/sdks/nodejs/quick-start
 */
import { SquareClient, SquareEnvironment } from "square";

let _client: SquareClient | null = null;

export function getSquareEnvironment(): "sandbox" | "production" {
  const env = (process.env.SQUARE_ENVIRONMENT || "sandbox").toLowerCase();
  return env === "production" ? "production" : "sandbox";
}

export function getSquareClient(): SquareClient {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) {
    throw new Error("SQUARE_ACCESS_TOKEN not configured on server");
  }
  if (_client) return _client;
  const environment =
    getSquareEnvironment() === "production"
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox;
  _client = new SquareClient({ token, environment });
  return _client;
}

export function getSquareLocationId(): string {
  const id = process.env.SQUARE_LOCATION_ID;
  if (!id) throw new Error("SQUARE_LOCATION_ID not configured on server");
  return id;
}

export function getSquareApplicationId(): string | undefined {
  return process.env.SQUARE_APPLICATION_ID;
}

export function getWebhookSignatureKey(): string {
  const k = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  if (!k) throw new Error("SQUARE_WEBHOOK_SIGNATURE_KEY not configured");
  return k;
}

/**
 * Returns base URL for signature verification.
 * Square verifies against full HTTPS URL of webhook subscription.
 * Prefer PUBLIC_SITE_URL env, fallback to request host header.
 */
export function getWebhookNotificationUrl(req: any): string {
  const configured = process.env.PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) return `${configured}/api/webhooks/square`;
  const proto = (req.headers?.["x-forwarded-proto"] as string) || "https";
  const host = (req.headers?.host as string) || "example.netlify.app";
  return `${proto}://${host}/api/webhooks/square`;
}
