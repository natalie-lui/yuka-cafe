const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const path = require("path");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));
app.use(session({
  secret: "yuka-secret-key",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// --- Routes ---
app.use("/api/drinks",   require("./routes/drinks"));
app.use("/api/cart",     require("./routes/cart"));
app.use("/api/checkout", require("./routes/checkout"));
app.use("/api/slots",    require("./routes/slots"));

// --- Start ---
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});