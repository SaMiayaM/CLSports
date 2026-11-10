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

export type BillingContact = {
  givenName: string;
  familyName: string;
  email: string;
  phone: string;
  addressLines: string[];
  city: string;
  state: string;
  countryCode: string;
  postalCode: string;
};

type SquarePayments = NonNullable<Awaited<ReturnType<typeof Square.payments>>>;
type SquareCard = Awaited<ReturnType<SquarePayments["card"]>>;

type UiState = "idle" | "submitting" | "success" | "declined" | "error";

function mapToUserMessage(raw: string): string {
  // Never show raw Square API errors — map to safe, actionable messages
  const s = raw.toLowerCase();
  if (s.includes("threeds") || s.includes("3ds") || s.includes("authentication") || s.includes("verification")) {
    return "Your bank could not verify this payment. Check your billing details and try again.";
  }
  if (s.includes("network") || s.includes("fetch") || s.includes("timeout")) {
    return "The secure payment check could not be completed. Check your connection and try again.";
  }
  if (s.includes("declined") || s.includes("card_declined")) return "Your card was declined. Please try a different card.";
  if (s.includes("insufficient")) return "Insufficient funds. Please try a different card.";
  if (s.includes("cvv") || s.includes("invalid") || s.includes("card data")) return "Card details were invalid. Please check and try again.";
  if (s.includes("avs") || s.includes("cvv")) return "Your billing details could not be verified. Check them and try again.";
  if (s.includes("temporarily") || s.includes("unavailable")) return "Payment service is temporarily unavailable. Please try again.";
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
  const [billingContact, setBillingContact] = useState<BillingContact>({
    givenName: "",
    familyName: "",
    email: "",
    phone: "",
    addressLines: [""],
    city: "",
    state: "",
    countryCode: "US",
    postalCode: "",
  });

  const serverCurrency = "USD";
  const serverAmount = (orderItems ?? []).reduce((total, item) => {
    const unitPriceCents = item.category === "Kids" ? 2500 : 3500;
    return total + unitPriceCents * item.quantity;
  }, 0) / 100;
  const tokenizationAmount = serverAmount.toFixed(2);

  function updateBilling(field: keyof Omit<BillingContact, "addressLines">, value: string) {
    setBillingContact((current) => ({ ...current, [field]: value }));
  }

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
    setStatusMessage("Securely verifying your billing details…");

    try {
      const requiredBillingFields: Array<keyof Omit<BillingContact, "addressLines">> = [
        "givenName", "familyName", "email", "phone", "city", "state", "postalCode", "countryCode",
      ];
      if (
        requiredBillingFields.some((field) => !billingContact[field].trim()) ||
        !billingContact.addressLines[0].trim()
      ) {
        throw new Error("Please complete your billing information before continuing.");
      }

      const verificationDetails = {
        amount: tokenizationAmount,
        currencyCode: serverCurrency,
        intent: "CHARGE" as const,
        billingContact,
        customerInitiated: true,
        sellerKeyedIn: false,
      };

      const result = await cardRef.current.tokenize(verificationDetails);

      if (result.status !== "OK") {
        const detail = "errors" in result
          ? result.errors?.map((error) => error.message).join(" ")
          : "Secure payment verification was not completed.";
        throw new Error(detail || "Secure payment verification was not completed.");
      }
      const sourceId = result.token;
      if (!sourceId) {
        throw new Error("Square did not return a payment token.");
      }

      setStatusMessage("Processing payment…");

      // Only send token + safe order reference + orderItems (server recomputes total, ignores amount)
      const response = await fetch(createPaymentEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId,
          // amount is sent for display/debug only — server ignores it and recomputes from orderItems
          amount: tokenizationAmount,
          currency: serverCurrency,
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
    <form className={`${className ?? ""} checkout-form min-w-0`} onSubmit={handleSubmit} aria-live="polite">
      <div className="space-y-4">
        <div>
          <div className="font-display text-[10px] tracking-[0.22em] text-orange-400 uppercase mb-2">Secure Checkout</div>
          <div className="font-display font-bold text-lg text-white uppercase tracking-tight">{description}</div>
          <div className="font-body text-xs text-white/45 mt-1">
            {tokenizationAmount} {serverCurrency} • Secured by Square
          </div>
        </div>

        <div id={containerId} className="min-h-[140px] w-full rounded-xl border border-white/10 bg-[#111111] p-3" />

        <div className="space-y-3">
          <div className="font-display text-[10px] tracking-[0.22em] text-orange-400 uppercase">Billing Information</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {([
              ["givenName", "First name", "John", "given-name"],
              ["familyName", "Last name", "Doe", "family-name"],
              ["email", "Email", "you@example.com", "email"],
              ["phone", "Phone", "(908) 555-0142", "tel"],
              ["city", "City", "Rahway", "address-level2"],
              ["state", "State", "NJ", "address-level1"],
              ["postalCode", "ZIP code", "07065", "postal-code"],
              ["countryCode", "Country", "US", "country"],
            ] as const).map(([field, label, placeholder, autocomplete]) => (
              <label key={field} className="space-y-1">
                <span className="font-display text-[10px] tracking-[0.14em] text-white/45 uppercase">{label}</span>
                <input
                  type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
                  value={billingContact[field]}
                  onChange={(event) => updateBilling(field, event.target.value)}
                  placeholder={placeholder}
                  autoComplete={autocomplete}
                  required
                  className="form-input"
                />
              </label>
            ))}
            <label className="space-y-1 sm:col-span-2">
              <span className="font-display text-[10px] tracking-[0.14em] text-white/45 uppercase">Street address</span>
              <input
                type="text"
                value={billingContact.addressLines[0]}
                onChange={(event) => setBillingContact((current) => ({ ...current, addressLines: [event.target.value] }))}
                placeholder="123 Main Street"
                autoComplete="address-line1"
                required
                className="form-input"
              />
            </label>
          </div>
        </div>

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
            className="min-h-11 w-full rounded-sm bg-red-600 px-4 py-3 font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50 hover:bg-red-500"
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
