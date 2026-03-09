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
    // Fetch both items and images
    const response = await catalogApi.list({ types: "ITEM,IMAGE" });
    const objects = response.data || [];

    const items = objects.filter(obj => obj.type === "ITEM");
    const images = objects.filter(obj => obj.type === "IMAGE");

    // Build image lookup table
    const imageMap = {};
    images.forEach(img => {
      imageMap[img.id] = img.imageData?.url;
    });

    const drinks = items.map(item => {
      const itemData = item.itemData;
      const firstVar = itemData?.variations?.[0];

      const priceCents =
        firstVar?.itemVariationData?.priceMoney?.amount ?? 0;

      // Get image from ITEM level
      const imageId = itemData?.imageIds?.[0];
      const imageUrl = imageId ? imageMap[imageId] : null;

      return {
        id: item.id,
        name: itemData?.name ?? "Unnamed item",
        description: itemData?.description ?? "",
        price: Number(priceCents) / 100, // convert BigInt safely
        image: imageUrl,
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
    });

    const obj = response.object;
    if (!obj || obj.type !== "ITEM") {
      return res.status(404).json({ error: "Drink not found" });
    }

    const item = obj.itemData;
    const firstVar = item?.variations?.[0];
    const priceCents = firstVar?.itemVariationData?.priceMoney?.amount ?? 0;

    res.json({
      id: obj.id,
      name: item?.name ?? "Unnamed item",
      description: item?.description ?? "",
      price: priceCents / 100,
      image: null,
    });
  } catch (err) {
    console.error("Square drink details error:", err);
    res.status(500).json({ error: "Failed to load drink from Square" });
  }
});

app.get("/api/featured-drinks", async (req, res) => {
  try {
    const response = await catalogApi.list({ types: "ITEM,IMAGE" });
    const objects = response.data || [];

    // Separate items and images
    const items = objects.filter(obj => obj.type === "ITEM");
    const images = objects.filter(obj => obj.type === "IMAGE");

    // Build image lookup map
    const imageMap = {};
    images.forEach(img => {
      imageMap[img.id] = img.imageData?.url;
    });

    // Filter featured items (variation-level custom attribute)
    const featuredItems = items.filter(item => {
      const variations = item.itemData?.variations || [];

      return variations.some(variation => {
        const custom = variation.customAttributeValues;
        if (!custom) return false;

        return Object.values(custom).some(
          attr => attr.booleanValue === true
        );
      });
    });

    // Format response with image URL
    const formatted = featuredItems.map(item => ({
      id: item.id,
      name: item.itemData?.name,
      image: item.itemData?.imageIds?.length
        ? imageMap[item.itemData.imageIds[0]]
        : null
    }));

    res.json(formatted);

  } catch (err) {
    console.error("Featured drinks error:", err);
    res.status(500).json({ error: "Failed to load featured drinks" });
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

app.post("/api/checkout", async (req, res) => {
  try {
    const cart = req.session.cart || [];
    const { pickupTime } = req.body;

    if (!cart.length) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const lineItems = cart.map((item, index) => {
      return {
        uid: `line-${index}`,
        name: item.name,
        quantity: "1",
        basePriceMoney: {
          amount: BigInt(Math.round(item.price * 100)), 
          currency: "USD"
        },
        note: `PickupTime: ${pickupTime}, Milk: ${item.milk}, Sweetness: ${item.sweetness}, Ice: ${item.ice}`
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

//------------------SERVER---------------------
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});