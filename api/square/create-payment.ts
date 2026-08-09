export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { sourceId, amount, currency = "USD", locationId: requestLocationId, orderItems } = req.body ?? {};
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  const defaultLocationId = process.env.SQUARE_LOCATION_ID;
  const locationId = requestLocationId || defaultLocationId;

  if (!accessToken || !locationId) {
    res.status(500).json({ error: "Square server credentials are not configured." });
    return;
  }


  if (!sourceId) {
    res.status(400).json({ error: "sourceId is required." });
    return;
  }

  // If orderItems are provided, validate server-side pricing and compute total
  let computedAmount = null;
  if (Array.isArray(orderItems) && orderItems.length > 0) {
    try {
      const priceForCategory = (cat: string) => (cat === "Adult" ? 35 : 25);
      let sum = 0;
      for (const it of orderItems) {
        const qty = Number(it.quantity) || 0;
        const expectedPrice = Number(it.price) || priceForCategory(it.category);
        const serverPrice = priceForCategory(it.category);
        // Ensure client price doesn't undercut server price
        if (expectedPrice !== serverPrice) {
          // ignore client-sent price and use server price
        }
        sum += serverPrice * qty;
      }
      computedAmount = sum; // dollars
    } catch {
      res.status(400).json({ error: "Invalid orderItems format." });
      return;
    }
  }

  // If amount provided by client, ensure it matches computedAmount when orderItems present
  if (computedAmount !== null) {
    const clientAmount = amount ? Number(amount) : null;
    if (clientAmount !== null && Math.abs(clientAmount - computedAmount) > 0.001) {
      res.status(400).json({ error: "Amount mismatch with server-side order computation.", expected: computedAmount, provided: clientAmount });
      return;
    }
  }

  const finalAmount = computedAmount !== null ? computedAmount : Number(amount);
  if (!finalAmount || !Number.isFinite(finalAmount) || finalAmount <= 0) {
    res.status(400).json({ error: "amount must be a valid positive number." });
    return;
  }

  const amountInCents = Math.round(Number(finalAmount) * 100);

  if (!Number.isFinite(amountInCents) || amountInCents <= 0) {
    res.status(400).json({ error: "amount must be a valid positive number." });
    return;
  }

  const squareResponse = await fetch("https://connect.squareup.com/v2/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Square-Version": "2025-07-16",
    },
    body: JSON.stringify({
      source_id: sourceId,
      idempotency_key: crypto.randomUUID(),
      location_id: locationId,
      amount_money: {
        amount: amountInCents,
        currency,
      },
    }),
  });

  const payload = await squareResponse.json();

  res.status(squareResponse.status).json(payload);
}
