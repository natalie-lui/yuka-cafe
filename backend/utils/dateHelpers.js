const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const PICKUP_DAYS = new Set(["tuesday", "wednesday", "thursday", "sunday"]);

function getDayName(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return DAYS[d.getDay()];
}

function toDateStr(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const date = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${date}`;
}

function getUpcomingPickupDates() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + 1);

  const dates = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dayName = DAYS[d.getDay()];
    if (PICKUP_DAYS.has(dayName)) {
      dates.push(toDateStr(d));
    }
  }

  return dates;
}

module.exports = { getDayName, getUpcomingPickupDates };
