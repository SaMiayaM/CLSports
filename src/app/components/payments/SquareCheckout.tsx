import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import * as Square from "@square/web-sdk";

type SquareCheckoutProps = {
  applicationId: string;
  locationId: string;
  amount: string;
  currency?: string;
  description?: string;
  createPaymentEndpoint?: string;
  buttonLabel?: string;
  className?: string;
  onSuccess?: (result: unknown) => void;
  onError?: (error: Error) => void;
  orderItems?: Array<{ name: string; category: string; size: string; price: number; quantity: number }>;
};

type SquarePayments = NonNullable<Awaited<ReturnType<typeof Square.payments>>>;
type SquareCard = Awaited<ReturnType<SquarePayments["card"]>>;

export function SquareCheckout({
  applicationId,
  locationId,
  amount,
  currency = "USD",
  description = "Square checkout",
  createPaymentEndpoint = "/api/square/create-payment",
  buttonLabel = "Pay Now",
  className,
  onSuccess,
  onError,
}: SquareCheckoutProps) {
  const containerId = useId().replace(/:/g, "-");
  const cardRef = useRef<SquareCard | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function mountSquareCard() {
      try {
        setErrorMessage(null);
        setStatusMessage("Loading secure payment form...");
        setIsReady(false);

        const payments = await Square.payments(applicationId, locationId);

        if (!active) {
          return;
        }

        if (!payments) {
          throw new Error("Square could not initialize on this page.");
        }

        const card = await payments.card();

        if (!active) {
          return;
        }

        await card.attach(`#${containerId}`);

        if (!active) {
          return;
        }

        cardRef.current = card;
        setIsReady(true);
        setStatusMessage("Card details are secured by Square.");
      } catch (error) {
        if (!active) {
          return;
        }

        const nextError = error instanceof Error ? error : new Error("Unable to load Square checkout.");
        setErrorMessage(nextError.message);
        setStatusMessage(null);
        onError?.(nextError);
      }
    }

    mountSquareCard();

    return () => {
      active = false;
      cardRef.current = null;
      const mountNode = document.getElementById(containerId);

      if (mountNode) {
        mountNode.innerHTML = "";
      }
    };
  }, [applicationId, containerId, locationId, onError]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!cardRef.current) {
      setErrorMessage("Payment form is still loading.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setStatusMessage("Securely tokenizing payment...");

    try {
      const verificationDetails = {
        amount,
        currencyCode: currency,
        intent: "CHARGE",
        customerInitiated: true,
        sellerKeyedIn: false,
      };

      const result = await cardRef.current.tokenize(verificationDetails);
      const sourceId = (result as { token?: string }).token;

      if (!sourceId) {
        throw new Error("Square did not return a payment token.");
      }

      const response = await fetch(createPaymentEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId,
          amount,
          currency,
          locationId,
          description,
          orderItems: orderItems ?? null,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error((payload as { error?: string }).error || "Payment request failed.");
      }

      setStatusMessage("Payment submitted successfully.");
      onSuccess?.(payload);
    } catch (error) {
      const nextError = error instanceof Error ? error : new Error("Payment submission failed.");
      setErrorMessage(nextError.message);
      setStatusMessage(null);
      onError?.(nextError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={className} onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <div className="font-display text-[10px] tracking-[0.22em] text-orange-400 uppercase mb-2">Secure Checkout</div>
          <div className="font-display font-bold text-lg text-white uppercase tracking-tight">{description}</div>
          <div className="font-body text-xs text-white/45 mt-1">{amount} {currency}</div>
        </div>

        <div id={containerId} className="min-h-[140px] rounded-xl border border-white/10 bg-black/20 p-3" />

        {statusMessage && <p className="font-body text-xs text-white/45">{statusMessage}</p>}
        {errorMessage && <p className="font-body text-xs text-red-400">{errorMessage}</p>}

        <button
          type="submit"
          disabled={!isReady || isSubmitting}
          className="w-full rounded-sm bg-red-600 px-4 py-3 font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Processing..." : buttonLabel}
        </button>
      </div>
    </form>
  );
}
