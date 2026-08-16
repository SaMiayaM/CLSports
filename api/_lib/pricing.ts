/**
 * Server-authoritative pricing — NEVER trust amount from client.
 * CL Sports Club: Kids $25, Adults $35 (USD)
 * Extend this file to load from DB/product catalog as needed.
 */

export type OrderItemInput = {
  name?: string;
  category: string; // "Adult" | "Kids"
  size?: string;
  quantity: number;
  price?: number; // ignored if mismatched, recomputed server-side
  productId?: string;
};

const PRICE_CENTS: Record<string, number> = {
  Adult: 3500,
  Kids: 2500,
};

export function priceCentsForCategory(category: string): number {
  const normalized = String(category).trim();
  // Default to Adult price if unknown to avoid undercharge; log warning outside
  return PRICE_CENTS[normalized] ?? PRICE_CENTS["Adult"];
}

export function validateOrderItems(orderItems: unknown): { valid: true; items: OrderItemInput[] } | { valid: false; error: string } {
  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    return { valid: false, error: "orderItems must be a non-empty array" };
  }
  const cleaned: OrderItemInput[] = [];
  for (const [idx, raw] of orderItems.entries()) {
    const it = raw as any;
    if (!it || typeof it !== "object") return { valid: false, error: `orderItems[${idx}] invalid` };
    const category = String(it.category || "").trim();
    if (!["Adult", "Kids"].includes(category)) {
      return { valid: false, error: `orderItems[${idx}].category must be Adult or Kids` };
    }
    const qty = Number(it.quantity);
    if (!Number.isInteger(qty) || qty <= 0 || qty > 99) {
      return { valid: false, error: `orderItems[${idx}].quantity must be integer 1..99` };
    }
    // size optional but if present validate
    if (it.size !== undefined && typeof it.size !== "string") {
      return { valid: false, error: `orderItems[${idx}].size invalid` };
    }
    cleaned.push({
      name: typeof it.name === "string" ? it.name.slice(0, 200) : undefined,
      category,
      size: typeof it.size === "string" ? it.size.slice(0, 20) : undefined,
      quantity: qty,
      productId: typeof it.productId === "string" ? it.productId.slice(0, 100) : undefined,
    });
  }
  return { valid: true, items: cleaned };
}

export function computeTotalCents(items: OrderItemInput[]): number {
  let sum = 0;
  for (const it of items) {
    sum += priceCentsForCategory(it.category) * it.quantity;
  }
  return sum;
}

/**
 * For future: load from DB, apply taxes/discounts server-side here.
 * Example: async function loadProductPrice(productId) { ... }
 */
