const express = require("express");
const router = express.Router();
const db = require("../db");
const { getDayName, getUpcomingWeekend } = require("../utils/dateHelpers");

// GET /api/slots for upcoming weekend
router.get("/", (req, res) => {
  const dates = getUpcomingWeekend(); // ["2026-05-02", "2026-05-03", "2026-05-04"]

  const result = dates.map(date => {
    const dayName = getDayName(date);

    const scheduled = db.prepare(`
      SELECT time, max_orders FROM schedule
      WHERE day_of_week = ? ORDER BY time
    `).all(dayName);

    if (!scheduled.length) {
      return { date, dayName, available: [], closed: true };
    }

    const booked = db.prepare(`
      SELECT time, COUNT(*) as count FROM bookings
      WHERE date = ? GROUP BY time
    `).all(date);

    const bookedMap = {};
    booked.forEach(b => bookedMap[b.time] = b.count);

    const available = scheduled
      .filter(slot => (bookedMap[slot.time] || 0) < slot.max_orders)
      .map(slot => ({
        time: slot.time,
        remaining: slot.max_orders - (bookedMap[slot.time] || 0)
      }));

    return { date, dayName, available };
  });

  res.json(result);
});

// POST /api/slots/claim
router.post("/claim", (req, res) => {
  const { date, time, orderId } = req.body;
  const dayName = getDayName(date);

  const slot = db.prepare(`
    SELECT max_orders FROM schedule WHERE day_of_week = ? AND time = ?
  `).get(dayName, time);

  if (!slot) {
    return res.status(400).json({ error: "That time slot doesn't exist" });
  }

  const claim = db.transaction(() => {
    const { count } = db.prepare(`
      SELECT COUNT(*) as count FROM bookings WHERE date = ? AND time = ?
    `).get(date, time);

    if (count >= slot.max_orders) return { full: true };

    db.prepare(`
      INSERT INTO bookings (date, time, order_id) VALUES (?, ?, ?)
    `).run(date, time, orderId || null);

    return { full: false };
  });

  const result = claim();

  if (result.full) {
    return res.status(409).json({ error: "Slot is full — please pick another time" });
  }

  res.json({ success: true });
});

module.exports = router;