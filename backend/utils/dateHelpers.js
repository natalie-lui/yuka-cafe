const DAYS = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];

function getDayName(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return DAYS[d.getDay()];
}

function getDateStr(daysAhead = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split("T")[0];
}

function getUpcomingWeekend() {
  const d = new Date();
  d.setDate(d.getDate() + 1);

  // advance to Friday
  while (d.getDay() !== 5) {
    d.setDate(d.getDate() + 1);
  }

  // build date strings for Fri, Sat, Sun, Mon
  return [0, 1, 2, 3].map(offset => {
    const day = new Date(d);
    day.setDate(d.getDate() + offset);
    const year  = day.getFullYear();
    const month = String(day.getMonth() + 1).padStart(2, "0");
    const date  = String(day.getDate()).padStart(2, "0");
    return `${year}-${month}-${date}`;
  });
}


module.exports = { getDayName, getDateStr, getUpcomingWeekend };