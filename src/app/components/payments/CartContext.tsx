import React, { createContext, useContext, useState } from "react";

export type CartItem = {
  id: string; // unique id for line item
  productId?: string;
  name: string;
  category: "Adult" | "Kids";
  size: string;
  price: number; // in dollars
  quantity: number;
  image?: string;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id" | "quantity"> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateItemQuantity: (id: string, nextQty: number) => void;
  clear: () => void;
  total: () => number;
};

const CartCtx = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem("cl-cart");
      return raw ? JSON.parse(raw) as CartItem[] : [];
    } catch {
      return [];
    }
  });

  // Persist cart to localStorage whenever items change
  React.useEffect(() => {
    try {
      localStorage.setItem("cl-cart", JSON.stringify(items));
    } catch {
      // noop
    }
  }, [items]);

  function addItem(payload: Omit<CartItem, "id" | "quantity"> & { quantity?: number }) {
    const addQty = payload.quantity ?? 1;
    setItems((cur) => {
      const foundIndex = cur.findIndex(i => i.productId === payload.productId && i.category === payload.category && i.size === payload.size && i.name === payload.name);
      if (foundIndex >= 0) {
        const next = [...cur];
        next[foundIndex] = { ...next[foundIndex], quantity: next[foundIndex].quantity + addQty };
        return next;
      }
      const id = `${payload.productId ?? payload.name}:${payload.category}:${payload.size}:${Date.now()}`;
      return [...cur, { id, quantity: addQty, ...payload }];
    });
  }

  function removeItem(id: string) {
    setItems((cur) => cur.filter(i => i.id !== id));
  }

  function updateItemQuantity(id: string, nextQty: number) {
    setItems((cur) => {
      if (nextQty <= 0) return cur.filter(i => i.id !== id);
      return cur.map(i => i.id === id ? { ...i, quantity: nextQty } : i);
    });
  }

  function clear() {
    setItems([]);
  }

  function total() {
    return items.reduce((s, it) => s + it.price * it.quantity, 0);
  }

  return (
    <CartCtx.Provider value={{ items, addItem, removeItem, updateItemQuantity, clear, total }}>
      {children}
    </CartCtx.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}

export default CartProvider;
