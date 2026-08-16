/**
 * Backwards-compatible alias for POST /api/square/create-payment
 * Secured implementation — delegates to ../payments/create.ts logic.
 * Keep this path so existing frontend (CartDrawer/SquareCheckout default) continues to work.
 */
import createPaymentHandler from "../payments/create.js";

export default async function handler(req: any, res: any) {
  return createPaymentHandler(req, res);
}
