import React from "react";
import { SquareCheckout } from "./SquareCheckout";

type OrderItem = { name: string; category: string; size: string; price: number; quantity: number };

type Props = {
  amount: number | string;
  orderItems?: OrderItem[];
  description?: string;
  buttonLabel?: string;
  className?: string;
  onSuccess?: (result: unknown) => void;
  onError?: (error: Error) => void;
};

/**
 * SquarePayment
 * - Reads client-side Vite env vars: `VITE_SQUARE_APPLICATION_ID` and `VITE_SQUARE_LOCATION_ID`.
 * - Uses the existing `SquareCheckout` component to render the Square Web Payments card.
 *
 * Security note: do NOT expose `SQUARE_ACCESS_TOKEN` to the browser. Server-side endpoints
 * (e.g. `/api/square/create-payment`) must read `process.env.SQUARE_ACCESS_TOKEN` and perform
 * the charge. This wrapper intentionally only reads Vite-prefixed vars which are safe for client use.
 */
export function SquarePayment({ amount, orderItems, description = "Purchase", buttonLabel, className, onSuccess, onError }: Props) {
  const applicationId = import.meta.env.VITE_SQUARE_APPLICATION_ID;
  const locationId = import.meta.env.VITE_SQUARE_LOCATION_ID;

  if (!applicationId || !locationId) {
    return (
      <div className={className}>
        <div className="rounded-lg border border-white/10 bg-black/20 p-4">
          <p className="font-body text-xs text-white/55 leading-relaxed">
            Set `VITE_SQUARE_APPLICATION_ID` and `VITE_SQUARE_LOCATION_ID` to enable payments.
          </p>
        </div>
      </div>
    );
  }

  return (
    <SquareCheckout
      applicationId={applicationId}
      locationId={locationId}
      amount={typeof amount === "number" ? amount.toFixed(2) : amount}
      currency="USD"
      description={description}
      createPaymentEndpoint="/api/square/create-payment"
      buttonLabel={buttonLabel ?? "Pay Now"}
      className={className}
      orderItems={orderItems}
      onSuccess={onSuccess}
      onError={onError}
    />
  );
}

export default SquarePayment;
