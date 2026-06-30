const db = require("./db");

const eveningTimes = [
  "9:00 PM", "9:30 PM", "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM",
];

const morningTimes = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM",
];

const schedule = [];

["tuesday", "wednesday", "thursday"].forEach(day => {
  eveningTimes.forEach(time => schedule.push({ day, time, max: 4 }));
});

morningTimes.forEach(time => {
  schedule.push({ day: "sunday", time, max: 4 });
});

db.exec("DELETE FROM schedule");

const insert = db.prepare(`
  INSERT INTO schedule (day_of_week, time, max_orders)
  VALUES (?, ?, ?)
`);

schedule.forEach(s => insert.run(s.day, s.time, s.max));
console.log("Schedule seeded!");
