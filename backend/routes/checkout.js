const express = require("express");
const router = express.Router();
const { randomUUID } = require("crypto");
const db = require("../db");
const { getDayName } = require("../utils/dateHelpers");

const squareClient = require("../utils/squareClient");

// POST /api/checkout
router.post("/", async (req, res) => {
  try {
    const cart = req.session.cart || [];
    const { pickupTime, pickupDate } = req.body;

    if (!cart.length) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // claim slot atomically before creating payment link
    const claim = db.transaction(() => {
      const dayName = getDayName(pickupDate);

      const slot = db.prepare(`
        SELECT max_orders FROM schedule WHERE day_of_week = ? AND time = ?
      `).get(dayName, pickupTime);

      if (!slot) return { error: "Invalid time slot" };

      const { count } = db.prepare(`
        SELECT COUNT(*) as count FROM bookings WHERE date = ? AND time = ?
      `).get(pickupDate, pickupTime);

      if (count >= slot.max_orders) return { error: "Slot is full" };

      db.prepare(`
        INSERT INTO bookings (date, time) VALUES (?, ?)
      `).run(pickupDate, pickupTime);

      return { success: true };
    });

    const claimResult = claim();
    if (claimResult.error) {
      return res.status(409).json({ error: claimResult.error });
    }

    const lineItems = cart.map((item, index) => {
      const modifiersNote = item.modifiers
        ? Object.entries(item.modifiers)
            .map(([key, value]) => `${key}: ${value}`)
            .join("\n")
        : "";

      const fullNote = [
        `Pickup Time: ${pickupTime}`,
        modifiersNote,
        item.note ? `Notes: ${item.note}` : null
      ].filter(Boolean).join("\n");

      return {
        uid: `line-${index}`,
        name: item.name,
        quantity: "1",
        basePriceMoney: {
          amount: BigInt(Math.round(item.price * 100)),
          currency: "USD"
        },
        note: fullNote
      };
    });

    const linkRes = await squareClient.checkout.paymentLinks.create({
      idempotencyKey: randomUUID(),
      order: {
        locationId: process.env.SQUARE_LOCATION_ID,
        lineItems
      }
    });

    res.json({ checkoutUrl: linkRes.paymentLink.url });

  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({ error: "Checkout failed" });
  }
});

module.exports = router;