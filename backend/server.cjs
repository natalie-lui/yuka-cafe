const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const path = require("path");
const { SquareClient, SquareEnvironment, SquareError } = require("square");

//setup express
const app = express();
const PORT = process.env.PORT || 3000;
const fs = require("fs")

//set up cart sessions
const session = require("express-session");

//use express in order to read JSON
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

let cart = [];

//SQUARE CLIENT SETUP
const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: SquareEnvironment.Production,
});

const catalogApi = squareClient.catalog;

app.use(
  session({
    secret: "yuka-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // true only if HTTPS
  })
);

// ----------------------- ROUTES ----------------------------
// basic check
app.get("/", (req, res) => {
  res.send("Yuka Cafe backend is running");
});

app.get("/api/drinks", async (req, res) => {
  try {
    // fetch everything
    const response = await catalogApi.list({
      types: "ITEM,IMAGE,CATEGORY"
    });

    const objects = response.data || [];

    // split by object type
    const items = objects.filter(obj => obj.type === "ITEM");
    const images = objects.filter(obj => obj.type === "IMAGE");
    const categories = objects.filter(obj => obj.type === "CATEGORY");

    // build image map
    const imageMap = {};
    images.forEach(img => {
      if (img.id && img.imageData?.url) {
        imageMap[img.id] = img.imageData.url;
      }
    });

    // build category map
    const categoryMap = {};
    categories.forEach(cat => {
      if (cat.id && cat.categoryData?.name) {
        categoryMap[cat.id] = cat.categoryData.name.toLowerCase();
      }
    });

    // build drinks array
    const drinks = items.map(item => {
      const itemData = item.itemData || {};

      // price
      const firstVar = itemData.variations?.[0];
      const priceCents =
        firstVar?.itemVariationData?.priceMoney?.amount ?? 0;

      // image array
      const imageIds = itemData?.imageIds || [];
      const imageUrls = imageIds
        .map(id => imageMap[id])
        .filter(Boolean); // remove undefined

      // category
      const categoryId = itemData.categories?.[0]?.id;
      const categoryName = categoryId
        ? categoryMap[categoryId]
        : "uncategorized";

      return {
        id: item.id,
        name: itemData.name || "Unnamed item",
        description: itemData.description || "",
        price: Number(priceCents) / 100,
        image: imageUrls.length ? imageUrls[0] : "/images/drink-img-filler.png",
        category: categoryName || "uncategorized"
      };
    });

    res.json(drinks);

  } catch (err) {
    console.error("Square drinks error:", err);
    res.status(500).json({ error: "Failed to load drinks from Square" });
  }
});

// GET single drink by Square ID
app.get("/api/drinks/:squareId", async (req, res) => {
  try {
    const { squareId } = req.params;

    const response = await catalogApi.object.get({
      objectId: squareId,
      includeRelatedObjects: true,
    });

    const obj = response.object;
    if (!obj || obj.type !== "ITEM") {
      return res.status(404).json({ error: "Drink not found" });
    }

    const item = obj.itemData;
    const firstVar = item?.variations?.[0];
    const priceCents = firstVar?.itemVariationData?.priceMoney?.amount ?? 0;

    // ---------------- IMAGE ----------------
    let imageUrls = [];

    if (item?.imageIds?.length && response.relatedObjects) {
      imageUrls = item.imageIds
        .map(imageId => {
          const imgObj = response.relatedObjects.find(
            o => o.id === imageId && o.type === "IMAGE"
          );
          return imgObj?.imageData?.url;
        })
        .filter(Boolean);
    }

    // ---------------- MODIFIERS ----------------
    let modifiers = [];

    if (item?.modifierListInfo?.length && response.relatedObjects) {
      const modifierListIds = item.modifierListInfo.map(
        (m) => m.modifierListId
      );

      const modifierLists = response.relatedObjects.filter(
        (obj) =>
          obj.type === "MODIFIER_LIST" &&
          modifierListIds.includes(obj.id)
      );

      modifiers = modifierLists.map((list) => ({
        name: list.modifierListData?.name,
        options: list.modifierListData?.modifiers?.map((mod) => ({
          id: mod.id,
          name: mod.modifierData?.name,
          price: Number(mod.modifierData?.priceMoney?.amount ?? 0n) / 100,
        })),
      }));
    }

    res.json({
      id: obj.id,
      name: item?.name ?? "Unnamed item",
      description: item?.description ?? "",
      price: Number(priceCents) / 100,
      image: imageUrls[0] || null, //default first img
      images: imageUrls.length ? imageUrls : ["/images/drink-img-filler.png"],
      modifiers,
    });

  } catch (err) {
    console.error("Square drink details error:", err);
    res.status(500).json({ error: "Failed to load drink from Square" });
  }
});

//CART ROUTE
// Add to cart
app.post("/api/cart", (req, res) => {
  if (!req.session.cart) {
    req.session.cart = [];
  }

  req.session.cart.push(req.body);

  res.json({
    success: true,
    cart: req.session.cart,
  });
});

// Get cart
app.get("/api/cart", (req, res) => {
  res.json(req.session.cart || []);
});


app.post("/api/cart/clear", (req, res) => {
  req.session.cart = [];
  res.json({ success: true });
});

//delete from cart
app.delete("/api/cart/:index", (req, res) => {
  const index = Number(req.params.index);

  if (!req.session.cart || index < 0 || index >= req.session.cart.length) {
    return res.status(400).json({ success: false, message: "Invalid index" });
  }

  req.session.cart.splice(index, 1);

  res.json({ success: true });
});

const { randomUUID } = require("crypto");

//CHECKOUT
const db = require("./db");

const DAYS = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];

function getDateStr(daysAhead = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split("T")[0]; // "2026-05-02"
}

function getDayName(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return DAYS[d.getDay()];
}

app.post("/api/checkout", async (req, res) => {
  try {
    const cart = req.session.cart || [];
    const { pickupTime, pickupDate } = req.body; // add pickupDate to your frontend

    if (!cart.length) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // claim the slot BEFORE creating the Square payment link
    const claim = db.transaction(() => {
      const dayName = getDayName(pickupDate);
      const slot = db.prepare(`
        SELECT max_orders FROM schedule WHERE day_of_week = ? AND time = ?
      `).get(dayName, pickupTime);

      if (!slot) return { error: "Invalid time slot" };

      const { count } = db.prepare(`
        SELECT COUNT(*) as count FROM bookings WHERE date = ? AND time = ?
      `).get(pickupDate, pickupTime);

      if (count >= slot.max_orders) return { error: "Slot is full" };

      db.prepare(`
        INSERT INTO bookings (date, time) VALUES (?, ?)
      `).run(pickupDate, pickupTime);

      return { success: true };
    });

    const claimResult = claim();
    if (claimResult.error) {
      return res.status(409).json({ error: claimResult.error });
    }

    const lineItems = cart.map((item, index) => {
      // Build a string for modifiers
      const modifiersNote = item.modifiers
        ? Object.entries(item.modifiers)
            .map(([key, value]) => `${key}: ${value}`)
            .join("\n")
        : "";

      //build full note - modifiers, custom note, pickup time
      const fullNote = [
        `Pickup Time: ${pickupTime}`,
        modifiersNote,
        item.note ? `Notes: ${item.note}` : null
      ]
        .filter(Boolean) //removes null vals
        .join("\n");


      return {
        uid: `line-${index}`,
        name: item.name,
        quantity: "1",
        basePriceMoney: {
          amount: BigInt(Math.round(item.price * 100)),
          currency: "USD"
        },
        note: fullNote
      };
    });

    const linkRes = await squareClient.checkout.paymentLinks.create({
      idempotencyKey: randomUUID(),
      order: {
        locationId: process.env.SQUARE_LOCATION_ID,
        lineItems
      }
    });

    res.json({ checkoutUrl: linkRes.paymentLink.url });

  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({ error: "Checkout failed" });
  }
});

//TIME SLOTS

// GET /api/slots?date=2026-05-02
// Returns available times for a given date
app.get("/api/slots", (req, res) => {
  const date = req.query.date || getDateStr(1);
  const dayName = getDayName(date);

  const scheduled = db.prepare(`
    SELECT time, max_orders FROM schedule
    WHERE day_of_week = ?
    ORDER BY time
  `).all(dayName);

  if (!scheduled.length) {
    return res.json({ date, available: [], closed: true });
  }

  const booked = db.prepare(`
    SELECT time, COUNT(*) as count
    FROM bookings WHERE date = ?
    GROUP BY time
  `).all(date);

  const bookedMap = {};
  booked.forEach(b => bookedMap[b.time] = b.count);

  const available = scheduled
    .filter(slot => (bookedMap[slot.time] || 0) < slot.max_orders)
    .map(slot => ({
      time: slot.time,
      remaining: slot.max_orders - (bookedMap[slot.time] || 0)
    }));

  res.json({ date, available });
});


// POST /api/slots/claim
// Call this inside checkout to lock the slot
app.post("/api/slots/claim", (req, res) => {
  const { date, time, orderId } = req.body;
  const dayName = getDayName(date);

  const slot = db.prepare(`
    SELECT max_orders FROM schedule
    WHERE day_of_week = ? AND time = ?
  `).get(dayName, time);

  if (!slot) {
    return res.status(400).json({ error: "That time slot doesn't exist" });
  }

  // use a transaction so check + insert don't allow for double bookings
  const claim = db.transaction(() => {
    const { count } = db.prepare(`
      SELECT COUNT(*) as count FROM bookings
      WHERE date = ? AND time = ?
    `).get(date, time);

    if (count >= slot.max_orders) {
      return { full: true };
    }

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

//------------------SERVER---------------------
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});