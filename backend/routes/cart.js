const express = require("express");
const router = express.Router();

function getCartItem(req, index) {
  const cart = req.session.cart || [];
  if (index < 0 || index >= cart.length) return null;
  return cart[index];
}

// GET /api/cart
router.get("/", (req, res) => {
  res.json(req.session.cart || []);
});

// POST /api/cart
router.post("/", (req, res) => {
  if (!req.session.cart) req.session.cart = [];

  const item = {
    ...req.body,
    quantity: req.body.quantity || 1,
  };

  req.session.cart.push(item);
  res.json({ success: true, cart: req.session.cart });
});

// POST /api/cart/clear
router.post("/clear", (req, res) => {
  req.session.cart = [];
  res.json({ success: true });
});

// PATCH /api/cart/:index — update quantity
router.patch("/:index", (req, res) => {
  const index = Number(req.params.index);
  const item = getCartItem(req, index);

  if (!item) {
    return res.status(400).json({ success: false, message: "Invalid index" });
  }

  const quantity = Number(req.body.quantity);

  if (!Number.isFinite(quantity) || quantity < 1) {
    return res.status(400).json({ success: false, message: "Invalid quantity" });
  }

  req.session.cart = req.session.cart.map((entry, i) =>
    i === index ? { ...entry, quantity } : entry
  );
  res.json({ success: true, cart: req.session.cart });
});

// PUT /api/cart/:index — replace item fields, preserve quantity
router.put("/:index", (req, res) => {
  const index = Number(req.params.index);
  const existing = getCartItem(req, index);

  if (!existing) {
    return res.status(400).json({ success: false, message: "Invalid index" });
  }

  const { productId, name, price, modifiers, note, image } = req.body;

  req.session.cart[index] = {
    productId: productId ?? existing.productId,
    name: name ?? existing.name,
    price: price ?? existing.price,
    modifiers: modifiers ?? existing.modifiers,
    note: note ?? existing.note,
    image: image ?? existing.image,
    quantity: existing.quantity || 1,
  };

  res.json({ success: true, cart: req.session.cart });
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
