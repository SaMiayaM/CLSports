import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import * as Square from "@square/web-sdk";

type SquareCheckoutProps = {
  applicationId: string;
  locationId: string;
  amount: string; // display only; server recomputes from orderItems
  currency?: string;
  description?: string;
  createPaymentEndpoint?: string;
  buttonLabel?: string;
  className?: string;
  onSuccess?: (result: unknown) => void;
  onError?: (error: Error) => void;
  orderItems?: Array<{ name: string; category: string; size: string; price: number; quantity: number }>;
  orderReference?: string;
};

type SquarePayments = NonNullable<Awaited<ReturnType<typeof Square.payments>>>;
type SquareCard = Awaited<ReturnType<SquarePayments["card"]>>;

type UiState = "idle" | "submitting" | "success" | "declined" | "error";

function mapToUserMessage(raw: string): string {
  // Never show raw Square API errors — map to safe, actionable messages
  const s = raw.toLowerCase();
  if (s.includes("declined") || s.includes("card_declined")) return "Your card was declined. Please try a different card.";
  if (s.includes("insufficient")) return "Insufficient funds. Please try a different card.";
  if (s.includes("cvv") || s.includes("invalid") || s.includes("card data")) return "Card details were invalid. Please check and try again.";
  if (s.includes("verification") || s.includes("avs")) return "Card verification failed. Please try a different card.";
  if (s.includes("timeout") || s.includes("temporarily") || s.includes("unavailable")) return "Payment service is temporarily unavailable. Please try again.";
  if (s.includes("token")) return "Secure payment tokenization failed. Please re-enter your card.";
  if (s.includes("not configured") || s.includes("applicationid") || s.includes("location")) return "Payment is not configured. Please contact support.";
  return "Payment failed. Please try again with a different card or contact support.";
}

export function SquareCheckout({
  applicationId,
  locationId,
  amount,
  currency = "USD",
  description = "Square checkout",
  createPaymentEndpoint = "/api/payments/create",
  buttonLabel = "Pay Now",
  className,
  onSuccess,
  onError,
  orderItems,
  orderReference,
}: SquareCheckoutProps) {
  const containerId = useId().replace(/:/g, "-");
  const cardRef = useRef<SquareCard | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [uiState, setUiState] = useState<UiState>("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ── Mount Web Payments SDK card (secure hosted iframe) ──
  useEffect(() => {
    let active = true;

    async function mountSquareCard() {
      try {
        setErrorMessage(null);
        setStatusMessage("Loading secure payment form…");
        setIsReady(false);

        if (!applicationId || !locationId) {
          throw new Error("Missing applicationId or locationId");
        }

        // Official SDK: Square.payments(appId, locationId)
        const payments = await Square.payments(applicationId, locationId);

        if (!active) return;
        if (!payments) throw new Error("Square could not initialize on this page.");

        const card = await payments.card();
        if (!active) return;
        await card.attach(`#${containerId}`);
        if (!active) return;

        cardRef.current = card;
        setIsReady(true);
        setUiState("idle");
        setStatusMessage("Card details are secured by Square.");
      } catch (error) {
        if (!active) return;
        const msg = error instanceof Error ? error.message : "Unable to load Square checkout.";
        setErrorMessage(mapToUserMessage(msg));
        setStatusMessage(null);
        setUiState("error");
        onError?.(error instanceof Error ? error : new Error(msg));
      }
    }

    mountSquareCard();

    return () => {
      active = false;
      cardRef.current?.destroy?.();
      cardRef.current = null;
      const mountNode = document.getElementById(containerId);
      if (mountNode) mountNode.innerHTML = "";
    };
  }, [applicationId, containerId, locationId, onError]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cardRef.current) {
      setErrorMessage("Payment form is still loading. Please wait.");
      return;
    }
    if (!orderItems || orderItems.length === 0) {
      setErrorMessage("Your cart is empty.");
      return;
    }

    setUiState("submitting");
    setErrorMessage(null);
    setStatusMessage("Securely tokenizing payment…");

    try {
      // Tokenize: SDK returns { status, token?, errors? } — do not log token
      const verificationDetails = {
        amount,
        currencyCode: currency,
        intent: "CHARGE" as const,
        customerInitiated: true,
        sellerKeyedIn: false,
      };

      const result: any = await cardRef.current.tokenize(verificationDetails);

      // SDK v2: tokenize() resolves with { status: "OK", token } or { status: "FAILED", errors }
      if (result?.status && result.status !== "OK") {
        const detail = result.errors?.[0]?.message || result.errors?.[0]?.detail || "Tokenization failed";
        throw new Error(detail);
      }
      const sourceId = result?.token as string | undefined;
      if (!sourceId) {
        throw new Error(result?.errors?.[0]?.message || "Square did not return a payment token.");
      }

      setStatusMessage("Processing payment…");

      // Only send token + safe order reference + orderItems (server recomputes total, ignores amount)
      const response = await fetch(createPaymentEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId,
          // amount is sent for display/debug only — server ignores it and recomputes from orderItems
          amount,
          currency,
          orderItems,
          orderReference,
        }),
      });

      const payload: any = await response.json().catch(() => ({}));

      if (!response.ok) {
        const raw = payload?.error || payload?.errors?.[0]?.detail || "Payment failed";
        const code = payload?.code || "";
        // Map decline codes to user-safe message, do not expose raw detail
        const msg = mapToUserMessage(`${code} ${raw}`);
        if (response.status === 402 || /declined|insufficient|verify/i.test(`${code} ${raw}`)) {
          setUiState("declined");
        } else {
          setUiState("error");
        }
        throw new Error(msg);
      }

      setUiState("success");
      setStatusMessage("Payment successful! You will receive a confirmation shortly.");
      setErrorMessage(null);
      onSuccess?.(payload);
    } catch (error) {
      const raw = error instanceof Error ? error.message : "Payment submission failed.";
      const safe = mapToUserMessage(raw);
      // Keep specific declined state if already set, otherwise generic error
      setUiState((prev) => (prev === "declined" ? "declined" : "error"));
      setErrorMessage(safe);
      setStatusMessage(null);
      onError?.(error instanceof Error ? error : new Error(safe));
    }
  }

  const isSubmitting = uiState === "submitting";

  return (
    <form className={className} onSubmit={handleSubmit} aria-live="polite">
      <div className="space-y-4">
        <div>
          <div className="font-display text-[10px] tracking-[0.22em] text-orange-400 uppercase mb-2">Secure Checkout</div>
          <div className="font-display font-bold text-lg text-white uppercase tracking-tight">{description}</div>
          <div className="font-body text-xs text-white/45 mt-1">
            {amount} {currency} • Secured by Square
          </div>
        </div>

        <div id={containerId} className="min-h-[140px] rounded-xl border border-white/10 bg-black/20 p-3" />

        {/* Status / error region — never show raw Square payload */}
        {statusMessage && (
          <p className={`font-body text-xs ${uiState === "success" ? "text-emerald-400" : "text-white/45"}`} role="status">
            {statusMessage}
          </p>
        )}
        {errorMessage && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
            <p className="font-body text-xs text-red-300" role="alert">
              {errorMessage}
            </p>
            {(uiState === "error" || uiState === "declined") && (
              <p className="font-body text-[11px] text-white/50 mt-1">
                {uiState === "declined"
                  ? "Please try a different card. You can retry without refreshing."
                  : "Please check your card details and try again."}
              </p>
            )}
          </div>
        )}

        {uiState === "success" ? (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
            <p className="font-display font-bold text-sm text-emerald-300 uppercase">Payment Confirmed</p>
            <p className="font-body text-xs text-white/60 mt-1">Thank you! Your order is being processed.</p>
          </div>
        ) : (
          <button
            type="submit"
            disabled={!isReady || isSubmitting}
            aria-disabled={!isReady || isSubmitting}
            className="w-full rounded-sm bg-red-600 px-4 py-3 font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50 hover:bg-red-500"
          >
            {isSubmitting ? "Processing…" : buttonLabel}
          </button>
        )}

        <p className="font-body text-[10px] text-white/30 text-center leading-relaxed">
          Payments are securely tokenized by Square. Your card data never touches our servers.
        </p>
      </div>
    </form>
  );
}
