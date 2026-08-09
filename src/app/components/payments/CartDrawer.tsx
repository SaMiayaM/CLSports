import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useCart } from "./CartContext";
import { SquareCheckout } from "./SquareCheckout";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, removeItem, total, updateItemQuantity } = useCart();

  const amount = total();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60" onClick={onClose} />

          <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            className="fixed top-0 right-0 z-60 w-full sm:w-96 h-full bg-[#0b0b0b] border-l border-white/[0.06] p-6 overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-bold text-lg text-white">Your Cart</h3>
              <button onClick={onClose} className="text-white/60 hover:text-white"><X size={20}/></button>
            </div>

            <div className="space-y-4">
              {items.length === 0 && (
                <p className="font-body text-sm text-white/40">Your cart is empty.</p>
              )}

              {items.map(it => (
                <div key={it.id} className="flex items-center justify-between py-3 border-b border-white/[0.04]">
                  <div>
                    <div className="font-display text-sm text-white">{it.name}</div>
                    <div className="font-body text-xs text-white/45">{it.category} · {it.size}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <button onClick={() => updateItemQuantity(it.id, it.quantity - 1)} className="w-8 h-8 rounded-sm bg-white/5 text-white">-</button>
                      <div className="font-body text-sm text-white/80">{it.quantity}</div>
                      <button onClick={() => updateItemQuantity(it.id, it.quantity + 1)} className="w-8 h-8 rounded-sm bg-white/5 text-white">+</button>
                      <button onClick={() => removeItem(it.id)} className="ml-3 font-body text-xs text-red-400">Remove</button>
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

              {import.meta.env.VITE_SQUARE_APPLICATION_ID && import.meta.env.VITE_SQUARE_LOCATION_ID ? (
                <SquareCheckout
                  applicationId={import.meta.env.VITE_SQUARE_APPLICATION_ID}
                  locationId={import.meta.env.VITE_SQUARE_LOCATION_ID}
                  amount={amount.toFixed(2)}
                  currency="USD"
                  description="CL Sports Club purchase"
                  createPaymentEndpoint="/api/square/create-payment"
                  buttonLabel="Checkout with Square"
                  orderItems={items.map(i => ({ name: i.name, category: i.category, size: i.size, price: i.price, quantity: i.quantity }))}
                />
              ) : (
                <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                  <p className="font-body text-xs text-white/55 leading-relaxed mb-3">
                    To enable payments, set `VITE_SQUARE_APPLICATION_ID` and `VITE_SQUARE_LOCATION_ID` in your environment.
                  </p>
                  <button onClick={() => alert('Set Square env vars and wire the SquareCheckout component to the cart total.')} className="w-full rounded-sm bg-red-600 px-4 py-3 font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
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
