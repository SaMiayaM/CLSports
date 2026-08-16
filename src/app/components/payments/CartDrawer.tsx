import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useCart } from "./CartContext";
import { SquareCheckout } from "./SquareCheckout";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, removeItem, total, updateItemQuantity, clear } = useCart();
  const [orderRef] = React.useState(() => `cart_${Date.now()}`);
  const [didPay, setDidPay] = React.useState(false);

  const amount = total();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60"
            onClick={onClose}
          />

          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
            className="fixed top-0 right-0 z-60 w-full sm:w-96 h-full bg-[#0b0b0b] border-l border-white/[0.06] p-6 overflow-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-bold text-lg text-white">Your Cart</h3>
              <button onClick={onClose} className="text-white/60 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {items.length === 0 && !didPay && <p className="font-body text-sm text-white/40">Your cart is empty.</p>}

              {items.map((it) => (
                <div key={it.id} className="flex items-center justify-between py-3 border-b border-white/[0.04]">
                  <div>
                    <div className="font-display text-sm text-white">{it.name}</div>
                    <div className="font-body text-xs text-white/45">
                      {it.category} · {it.size}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <button onClick={() => updateItemQuantity(it.id, it.quantity - 1)} className="w-8 h-8 rounded-sm bg-white/5 text-white">
                        -
                      </button>
                      <div className="font-body text-sm text-white/80">{it.quantity}</div>
                      <button onClick={() => updateItemQuantity(it.id, it.quantity + 1)} className="w-8 h-8 rounded-sm bg-white/5 text-white">
                        +
                      </button>
                      <button onClick={() => removeItem(it.id)} className="ml-3 font-body text-xs text-red-400">
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-sm text-white">${(it.price * it.quantity).toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="font-body text-sm text-white/60">Total</div>
                <div className="font-display font-bold text-lg text-white">${amount.toFixed(2)}</div>
              </div>

              {didPay ? (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
                  <p className="font-display text-sm text-emerald-300">Payment complete</p>
                  <p className="font-body text-xs text-white/60 mt-1">You can close this drawer.</p>
                  <button
                    onClick={() => {
                      clear();
                      setDidPay(false);
                      onClose();
                    }}
                    className="mt-3 text-xs text-white/70 underline"
                  >
                    Clear cart
                  </button>
                </div>
              ) : import.meta.env.VITE_SQUARE_APPLICATION_ID && import.meta.env.VITE_SQUARE_LOCATION_ID ? (
                <SquareCheckout
                  applicationId={import.meta.env.VITE_SQUARE_APPLICATION_ID}
                  locationId={import.meta.env.VITE_SQUARE_LOCATION_ID}
                  amount={amount.toFixed(2)}
                  currency="USD"
                  description="CL Sports Club purchase"
                  createPaymentEndpoint="/api/payments/create"
                  buttonLabel={amount > 0 ? `Pay $${amount.toFixed(2)}` : "Checkout with Square"}
                  orderItems={items.map((i) => ({
                    name: i.name,
                    category: i.category,
                    size: i.size,
                    price: i.price,
                    quantity: i.quantity,
                  }))}
                  orderReference={orderRef}
                  onSuccess={() => setDidPay(true)}
                />
              ) : (
                <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                  <p className="font-body text-xs text-white/55 leading-relaxed mb-3">
                    To enable payments, set <code>VITE_SQUARE_APPLICATION_ID</code> and{" "}
                    <code>VITE_SQUARE_LOCATION_ID</code> in your environment (Netlify Dashboard → Environment
                    variables).
                  </p>
                  <button
                    onClick={() => alert("Set Square env vars in Netlify and redeploy. See SQUARE_SETUP.md")}
                    className="w-full rounded-sm bg-red-600 px-4 py-3 font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-white"
                  >
                    Checkout (configure Square)
                  </button>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export default CartDrawer;
