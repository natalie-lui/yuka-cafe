const express = require("express");
const router = express.Router();

// GET /api/cart
router.get("/", (req, res) => {
  res.json(req.session.cart || []);
});

// POST /api/cart
router.post("/", (req, res) => {
  if (!req.session.cart) req.session.cart = [];
  req.session.cart.push(req.body);
  res.json({ success: true, cart: req.session.cart });
});

// POST /api/cart/clear
router.post("/clear", (req, res) => {
  req.session.cart = [];
  res.json({ success: true });
});

// DELETE /api/cart/:index
router.delete("/:index", (req, res) => {
  const index = Number(req.params.index);

  if (!req.session.cart || index < 0 || index >= req.session.cart.length) {
    return res.status(400).json({ success: false, message: "Invalid index" });
  }

  req.session.cart.splice(index, 1);
  res.json({ success: true });
});

module.exports = router;