let currentDrink = null;
let editingCartIndex = null;

const customizeOverlay = document.getElementById("customize-overlay");
const customizeModal = document.querySelector(".customize-modal");

function openCustomizeModal(productId) {
  if (!productId || !customizeOverlay) return;

  editingCartIndex = null;
  customizeOverlay.classList.remove("hidden");
  customizeOverlay.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  loadDrink(productId);
}

function openCustomizeModalForEdit(productId, cartIndex, item) {
  if (!productId || !customizeOverlay) return;

  editingCartIndex = cartIndex;
  customizeOverlay.classList.remove("hidden");
  customizeOverlay.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  loadDrink(productId, item);
}

function closeCustomizeModal() {
  if (!customizeOverlay) return;

  customizeOverlay.classList.add("hidden");
  customizeOverlay.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  currentDrink = null;
  editingCartIndex = null;
  clearCustomizeError();
}

if (customizeOverlay) {
  customizeOverlay.addEventListener("click", closeCustomizeModal);
}

if (customizeModal) {
  customizeModal.addEventListener("click", (event) => {
    event.stopPropagation();
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;

  if (customizeOverlay && !customizeOverlay.classList.contains("hidden")) {
    closeCustomizeModal();
    return;
  }

  const cartPopupOverlay = document.getElementById("cart-popup-overlay");
  if (cartPopupOverlay && !cartPopupOverlay.classList.contains("hidden")) {
    closeCartPopup();
  }
});

function loadDrink(productId, prefillItem = null) {
  fetch(`/api/drinks/${productId}`)
    .then(res => {
      if (!res.ok) throw new Error("Drink not found");
      return res.json();
    })
    .then(drink => {
      currentDrink = drink;
      renderDrink(drink, prefillItem);
    })
    .catch(err => {
      console.error(err);
      closeCustomizeModal();
    });
}

function renderDrink(drink, prefillItem = null) {
  document.getElementById("customize-drink-name").textContent = drink.name;
  document.getElementById("customize-summary-name").textContent = drink.name;
  document.getElementById("customize-drink-description").textContent = drink.description || "";

  const noteField = document.getElementById("custom-note");
  if (noteField) noteField.value = prefillItem?.note || "";

  renderImages(drink, prefillItem);
  renderModifiers(drink, prefillItem);
  clearCustomizeError();
  updateCustomizeSummary();
}

function renderImages(drink, prefillItem = null) {
  const imgEl = document.getElementById("drink-image");
  const thumbnailColumn = document.getElementById("thumbnail-col");
  const images = drink.images?.length ? drink.images : ["images/shared/drink-img-filler.png"];
  const preferredImage = prefillItem?.image || images[0];

  imgEl.src = preferredImage;
  imgEl.alt = drink.name;
  thumbnailColumn.innerHTML = "";

  images.forEach((img, index) => {
    const thumb = document.createElement("img");
    thumb.src = img;
    thumb.className = "thumbnail";
    if (img === preferredImage || (index === 0 && !prefillItem?.image)) {
      thumb.classList.add("active");
    }

    thumb.addEventListener("click", () => {
      imgEl.src = img;
      thumbnailColumn.querySelectorAll(".thumbnail").forEach(t => t.classList.remove("active"));
      thumb.classList.add("active");
    });

    thumbnailColumn.appendChild(thumb);
  });
}

function renderModifiers(drink, prefillItem = null) {
  const container = document.getElementById("modifiers-container");
  const categoryList = document.getElementById("customize-adjustments-list");
  container.innerHTML = "";

  const modifierNames = (drink.modifiers || []).map(list => list.name);
  const categories = modifierNames.length ? [...modifierNames, "Notes"] : ["Notes"];
  categoryList.textContent = categories.join(", ");

  (drink.modifiers || []).forEach(list => {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "adjust-field";

    const legend = document.createElement("legend");
    legend.textContent = list.name;
    fieldset.appendChild(legend);

    if (list.name.toLowerCase().includes("milk")) {
      const note = document.createElement("p");
      note.className = "customize-modal__modifier-note";
      note.textContent = "*Milk alternatives have no extra cost";
      fieldset.appendChild(note);
    }

    const preselectedValue = prefillItem?.modifiers?.[list.name];

    list.options.forEach((opt) => {
      const label = document.createElement("label");
      const isChecked = preselectedValue === opt.name ? "checked" : "";
      label.innerHTML = `
        <input type="radio"
          name="${list.name}"
          value="${opt.name}"
          data-price="${opt.price}"
          ${isChecked}>
        <span>${opt.name}${opt.price ? ` (+$${opt.price.toFixed(2)})` : ""}</span>
      `;
      const input = label.querySelector("input");
      input.addEventListener("change", () => {
        clearCustomizeError();
        updateCustomizeSummary();
      });
      fieldset.appendChild(label);
    });

    container.appendChild(fieldset);
  });

  const noteField = document.getElementById("custom-note");
  if (noteField) {
    noteField.removeEventListener("input", updateCustomizeSummary);
    noteField.addEventListener("input", updateCustomizeSummary);
  }
}

function getSelectedModifiers() {
  const selectedModifiers = {};
  let modifierPriceTotal = 0;

  document.querySelectorAll("#modifiers-container fieldset").forEach(field => {
    const legend = field.querySelector("legend")?.textContent;
    const checked = field.querySelector("input:checked");
    if (legend && checked) {
      selectedModifiers[legend] = checked.value;
      modifierPriceTotal += Number(checked.dataset.price || 0);
    }
  });

  return { selectedModifiers, modifierPriceTotal };
}

function getMissingModifierFields() {
  const missing = [];

  document.querySelectorAll("#modifiers-container fieldset").forEach(field => {
    const legend = field.querySelector("legend")?.textContent;
    const checked = field.querySelector("input:checked");
    if (legend && !checked) {
      missing.push(field);
    }
  });

  return missing;
}

function showCustomizeError() {
  const errorEl = document.getElementById("customize-error");
  if (errorEl) errorEl.classList.remove("hidden");
}

function clearCustomizeError() {
  const errorEl = document.getElementById("customize-error");
  if (errorEl) errorEl.classList.add("hidden");
}

function updateCustomizeSummary() {
  if (!currentDrink) return;

  const { selectedModifiers, modifierPriceTotal } = getSelectedModifiers();
  const note = document.getElementById("custom-note")?.value.trim();
  const finalPrice = currentDrink.price + modifierPriceTotal;

  const summaryParts = Object.values(selectedModifiers);
  if (note) summaryParts.push(`Notes: ${note}`);

  document.getElementById("customize-summary-details").textContent = summaryParts.join(", ");
  document.getElementById("customize-price").textContent = `$${finalPrice.toFixed(2)}`;
}

const CART_POPUP_TRANSITION_MS = 300;

function openCartPopup(item) {
  const overlay = document.getElementById("cart-popup-overlay");
  const img = document.getElementById("popup-item-image");
  const nameEl = document.getElementById("popup-item-name");
  const modsEl = document.getElementById("popup-item-mods");
  const noteEl = document.getElementById("popup-item-note");
  if (!overlay || !img || !nameEl || !modsEl || !noteEl) return;

  img.src = item.image || "images/shared/drink-img-filler.png";
  img.alt = item.name;
  nameEl.textContent = item.name;

  const mods = Object.values(item.modifiers || {}).join(", ");
  modsEl.textContent = mods;

  noteEl.textContent = item.note ? `Notes: ${item.note}` : "";

  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  requestAnimationFrame(() => {
    overlay.classList.add("is-open");
  });
}

function closeCartPopup(onClosed) {
  const overlay = document.getElementById("cart-popup-overlay");
  if (!overlay || overlay.classList.contains("hidden")) {
    onClosed?.();
    return;
  }

  overlay.classList.remove("is-open");
  overlay.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";

  window.setTimeout(() => {
    overlay.classList.add("hidden");
    onClosed?.();
  }, CART_POPUP_TRANSITION_MS);
}

function showCartPopup(item) {
  openCartPopup(item);
}

function addToCart() {
  if (!currentDrink) return;

  const missingFields = getMissingModifierFields();
  if (missingFields.length > 0) {
    showCustomizeError();
    missingFields[0].scrollIntoView({ behavior: "smooth", block: "nearest" });
    return;
  }

  clearCustomizeError();

  const { selectedModifiers, modifierPriceTotal } = getSelectedModifiers();
  const note = document.getElementById("custom-note")?.value.trim() || "";
  const finalPrice = currentDrink.price + modifierPriceTotal;

  const cartItem = {
    productId: currentDrink.id,
    name: currentDrink.name,
    price: finalPrice,
    modifiers: selectedModifiers,
    note,
    image: currentDrink.image || currentDrink.images?.[0],
    quantity: 1,
  };

  const isEditing = editingCartIndex !== null;
  const url = isEditing ? `/api/cart/${editingCartIndex}` : "/api/cart";
  const method = isEditing ? "PUT" : "POST";

  fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cartItem),
  })
    .then(res => res.json())
    .then(() => {
      closeCustomizeModal();
      if (isEditing) {
        if (typeof loadBag === "function") loadBag();
      } else {
        showCartPopup(cartItem);
      }
    })
    .catch(err => console.error("Cart error:", err));
}

const continueOrderingBtn = document.getElementById("continue-ordering");
const goToBagBtn = document.getElementById("go-to-bag");

if (continueOrderingBtn) {
  continueOrderingBtn.onclick = () => {
    closeCartPopup();
  };
}

if (goToBagBtn) {
  goToBagBtn.onclick = () => {
    closeCartPopup(() => {
      if (typeof showCart === "function") showCart();
      else if (typeof openBag === "function") openBag();
    });
  };
}

const cartPopupOverlay = document.getElementById("cart-popup-overlay");
if (cartPopupOverlay) {
  cartPopupOverlay.addEventListener("click", closeCartPopup);
  cartPopupOverlay.querySelector(".cart-popup")?.addEventListener("click", (event) => {
    event.stopPropagation();
  });
}

function initCustomizeFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const customizeId = urlParams.get("customize") || urlParams.get("id");
  const editIndex = urlParams.get("edit");

  if (!customizeId || !document.querySelector(".menu-page")) return;

  if (editIndex !== null) {
    fetch("/api/cart")
      .then(res => res.json())
      .then(cart => {
        const item = cart[Number(editIndex)];
        if (item) {
          openCustomizeModalForEdit(customizeId, Number(editIndex), item);
        } else {
          openCustomizeModal(customizeId);
        }
      })
      .catch(() => openCustomizeModal(customizeId));
    return;
  }

  openCustomizeModal(customizeId);
}

window.addEventListener("DOMContentLoaded", initCustomizeFromUrl);

window.openCustomizeModal = openCustomizeModal;
window.openCustomizeModalForEdit = openCustomizeModalForEdit;
window.closeCustomizeModal = closeCustomizeModal;
window.openCartPopup = openCartPopup;
window.closeCartPopup = closeCartPopup;
window.addToCart = addToCart;
