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

module.exports = { getDayName, getDateStr };