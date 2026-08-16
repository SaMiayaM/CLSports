/**
 * Netlify Function: POST /.netlify/functions/create-payment
 * Also aliased as POST /api/payments/create via redirect in netlify.toml
 *
 * Wraps the shared Vercel-style handler for Netlify's lambda event shape.
 */
import type { Handler } from "@netlify/functions";
import createPaymentHandler from "../../api/payments/create.js";

// Adapt Netlify event to (req, res) shape expected by handler
export const handler: Handler = async (event) => {
  const method = event.httpMethod || "POST";
  const headers = event.headers as Record<string, string>;

  // Netlify parses body as string; keep raw string for handler
  const body = event.body ?? "{}";

  // Minimal req/res shim
  const reqShim: any = {
    method,
    headers,
    body,
    rawBody: event.body,
    socket: { remoteAddress: event.headers["x-nf-client-connection-ip"] || event.headers["client-ip"] },
  };

  let statusCode = 200;
  let responseBody: any = null;
  let responseHeaders: Record<string, string> = {};

  const resShim: any = {
    setHeader: (k: string, v: string) => (responseHeaders[k] = v),
    status: (code: number) => {
      statusCode = code;
      return resShim;
    },
    json: (b: any) => {
      responseBody = JSON.stringify(b);
      responseHeaders["Content-Type"] = "application/json";
      return resShim;
    },
    end: () => {
      if (!responseBody) responseBody = "";
    },
  };

  await createPaymentHandler(reqShim, resShim);

  return {
    statusCode,
    headers: responseHeaders,
    body: responseBody ?? "",
  };
};
