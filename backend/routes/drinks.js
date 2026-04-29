const express = require("express");
const router = express.Router();

const squareClient = require("../utils/squareClient");
const catalogApi = squareClient.catalog;


// GET /api/drinks
router.get("/", async (req, res) => {
  try {
    const response = await catalogApi.list({
      types: "ITEM,IMAGE,CATEGORY"
    });

    const objects = response.data || [];
    const items      = objects.filter(obj => obj.type === "ITEM");
    const images     = objects.filter(obj => obj.type === "IMAGE");
    const categories = objects.filter(obj => obj.type === "CATEGORY");

    const imageMap = {};
    images.forEach(img => {
      if (img.id && img.imageData?.url) imageMap[img.id] = img.imageData.url;
    });

    const categoryMap = {};
    categories.forEach(cat => {
      if (cat.id && cat.categoryData?.name)
        categoryMap[cat.id] = cat.categoryData.name.toLowerCase();
    });

    const drinks = items.map(item => {
      const itemData    = item.itemData || {};
      const firstVar    = itemData.variations?.[0];
      const priceCents  = firstVar?.itemVariationData?.priceMoney?.amount ?? 0;
      const imageIds    = itemData?.imageIds || [];
      const imageUrls   = imageIds.map(id => imageMap[id]).filter(Boolean);
      const categoryId  = itemData.categories?.[0]?.id;
      const categoryName = categoryId ? categoryMap[categoryId] : "uncategorized";

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

// GET /api/drinks/:squareId
router.get("/:squareId", async (req, res) => {
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

    const item       = obj.itemData;
    const firstVar   = item?.variations?.[0];
    const priceCents = firstVar?.itemVariationData?.priceMoney?.amount ?? 0;

    let imageUrls = [];
    if (item?.imageIds?.length && response.relatedObjects) {
      imageUrls = item.imageIds.map(imageId => {
        const imgObj = response.relatedObjects.find(
          o => o.id === imageId && o.type === "IMAGE"
        );
        return imgObj?.imageData?.url;
      }).filter(Boolean);
    }

    let modifiers = [];
    if (item?.modifierListInfo?.length && response.relatedObjects) {
      const modifierListIds = item.modifierListInfo.map(m => m.modifierListId);
      const modifierLists = response.relatedObjects.filter(
        obj => obj.type === "MODIFIER_LIST" && modifierListIds.includes(obj.id)
      );
      modifiers = modifierLists.map(list => ({
        name: list.modifierListData?.name,
        options: list.modifierListData?.modifiers?.map(mod => ({
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
      image: imageUrls[0] || null,
      images: imageUrls.length ? imageUrls : ["/images/drink-img-filler.png"],
      modifiers,
    });

  } catch (err) {
    console.error("Square drink details error:", err);
    res.status(500).json({ error: "Failed to load drink from Square" });
  }
});

module.exports = router;