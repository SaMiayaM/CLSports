/**
 * Netlify Function: POST /.netlify/functions/square-webhook
 * Aliased as POST /api/webhooks/square via netlify.toml redirect
 */
import type { Handler } from "@netlify/functions";
import webhookHandler from "../../api/webhooks/square.js";

export const handler: Handler = async (event) => {
  const method = event.httpMethod || "POST";
  const headers = event.headers as Record<string, string>;
  const body = event.body ?? "";

  const reqShim: any = {
    method,
    headers,
    body,
    rawBody: event.isBase64Encoded && event.body ? Buffer.from(event.body, "base64").toString("utf8") : event.body,
    socket: { remoteAddress: headers["x-nf-client-connection-ip"] || headers["client-ip"] },
    on: (evt: string, cb: any) => {
      // For readRawBody stream fallback, we simulate immediate data/end
      if (evt === "data" && body) cb(body);
      if (evt === "end") cb();
    },
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

  await webhookHandler(reqShim, resShim);

  return {
    statusCode,
    headers: responseHeaders,
    body: responseBody ?? "",
  };
};
