const express = require("express");
const router = express.Router();
const db = require("../db");
const { getDayName, getUpcomingPickupDates } = require("../utils/dateHelpers");

function parseTimeForSort(timeStr) {
  const [time, period] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function sortByTime(slots) {
  return [...slots].sort((a, b) => parseTimeForSort(a.time) - parseTimeForSort(b.time));
}

// GET /api/slots — upcoming pickup days within rolling 7-day window
router.get("/", (req, res) => {
  const dates = getUpcomingPickupDates();

  const result = dates.map(date => {
    const dayName = getDayName(date);

    const scheduled = sortByTime(db.prepare(`
      SELECT time, max_orders FROM schedule
      WHERE day_of_week = ?
    `).all(dayName));

    if (!scheduled.length) {
      return { date, dayName, available: [], closed: true, fullyBooked: true };
    }

    const booked = db.prepare(`
      SELECT time, COUNT(*) as count FROM bookings
      WHERE date = ? GROUP BY time
    `).all(date);

    const bookedMap = {};
    booked.forEach(b => { bookedMap[b.time] = b.count; });

    const available = scheduled.map(slot => {
      const bookedCount = bookedMap[slot.time] || 0;
      return {
        time: slot.time,
        remaining: slot.max_orders - bookedCount,
        full: bookedCount >= slot.max_orders,
      };
    });

    return {
      date,
      dayName,
      available,
      fullyBooked: available.every(s => s.full),
    };
  });

  res.json(result);
});

module.exports = router;
