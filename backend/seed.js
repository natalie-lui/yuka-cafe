const db = require("./db");

const schedule = [
  // Friday
  { day: "friday",   time: "10:00 AM", max: 4 },
  { day: "friday",   time: "10:30 AM", max: 4 },
  { day: "friday",   time: "11:00 AM", max: 4 },
  { day: "friday",   time: "11:30 AM", max: 4 },
  { day: "friday",   time: "12:00 PM", max: 4 },
  { day: "friday",   time: "12:30 PM", max: 4 },
  { day: "friday",   time: "1:00 PM",  max: 4 },
  { day: "friday",   time: "1:30 PM",  max: 4 },
  { day: "friday",   time: "2:00 PM",  max: 4 },
  { day: "friday",   time: "2:30 PM",  max: 4 },

  // Saturday
  { day: "saturday", time: "10:00 AM", max: 4 },
  { day: "saturday", time: "10:30 AM", max: 4 },
  { day: "saturday",   time: "11:00 AM", max: 4 },
  { day: "saturday",   time: "11:30 AM", max: 4 },
  { day: "saturday",   time: "12:00 PM", max: 4 },
  { day: "saturday",   time: "12:30 PM", max: 4 },
  { day: "saturday",   time: "1:00 PM",  max: 4 },
  { day: "saturday",   time: "1:30 PM",  max: 4 },
  { day: "saturday",   time: "2:00 PM",  max: 4 },
  { day: "saturday",   time: "2:30 PM",  max: 4 },

  //Sunday
  { day: "sunday",   time: "10:00 AM", max: 4 },
  { day: "sunday",   time: "10:30 AM", max: 4 },
  { day: "sunday",   time: "11:00 AM", max: 4 },
  { day: "sunday",   time: "11:30 AM", max: 4 },
  { day: "sunday",   time: "12:00 PM", max: 4 },
  { day: "sunday",   time: "12:30 PM", max: 4 },
  { day: "sunday",   time: "1:00 PM",  max: 4 },
  { day: "sunday",   time: "1:30 PM",  max: 4 },
  { day: "sunday",   time: "2:00 PM",  max: 4 },
  { day: "sunday",   time: "2:30 PM",  max: 4 },

  //Monday
  { day: "monday",   time: "10:00 AM", max: 4 },
  { day: "monday",   time: "10:30 AM", max: 4 },
  { day: "monday",   time: "11:00 AM", max: 4 },
  { day: "monday",   time: "11:30 AM", max: 4 },
  { day: "monday",   time: "12:00 PM", max: 4 },
  { day: "monday",   time: "12:30 PM", max: 4 },
  { day: "monday",   time: "1:00 PM",  max: 4 },
  { day: "monday",   time: "1:30 PM",  max: 4 },
  { day: "monday",   time: "2:00 PM",  max: 4 },
  { day: "monday",   time: "2:30 PM",  max: 4 }
];

const insert = db.prepare(`
    INSERT OR REPLACE INTO schedule (day_of_week, time, max_orders)
    VALUES (?, ?, ?)
`);

schedule.forEach(s => insert.run(s.day, s.time, s.max));
console.log("Schedule seeded!");