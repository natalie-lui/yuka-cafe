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
app.post("/api/checkout", async (req, res) => {
  try {
    const cart = req.session.cart || [];
    const { pickupTime } = req.body;

    if (!cart.length) {
      return res.status(400).json({ error: "Cart is empty" });
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

//------------------SERVER---------------------
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});