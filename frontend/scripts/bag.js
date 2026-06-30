const bagOverlay = document.getElementById("bag-overlay");
const panel = document.getElementById("bag-panel");
const pickupPanel = document.getElementById("pickup-view");
const bagItemsDiv = document.getElementById("bag-items");
const bagEmpty = document.getElementById("bag-empty");
const bagCheckoutBtn = document.getElementById("bag-checkout-btn");

function setBagView(view) {
  if (!bagOverlay) return;

  panel?.style.removeProperty("display");
  pickupPanel?.style.removeProperty("display");
  bagOverlay.classList.remove("bag-overlay--cart", "bag-overlay--pickup");
  bagOverlay.classList.add(view === "pickup" ? "bag-overlay--pickup" : "bag-overlay--cart");
}

function openBag() {
  setBagView("cart");
  bagOverlay.classList.remove("hidden");
  setTimeout(() => bagOverlay.classList.add("show"), 10);
  loadBag();
}

function closeBag() {
  bagOverlay.classList.add("hidden");
  setBagView("cart");
}

if (bagOverlay) {
  bagOverlay.addEventListener("click", () => {
    closeBag();
  });
}

if (panel) {
  panel.addEventListener("click", (event) => {
    event.stopPropagation();
  });
}

if (pickupPanel) {
  pickupPanel.addEventListener("click", (event) => {
    event.stopPropagation();
  });
}

function formatItemDetails(item) {
  const parts = item.modifiers ? Object.values(item.modifiers) : [];
  if (item.note) parts.push(`Notes: ${item.note}`);
  return parts.join(", ");
}

function updateCheckoutTotal(total) {
  if (bagCheckoutBtn) {
    bagCheckoutBtn.textContent = `CHECKOUT • $${total.toFixed(2)}`;
  }
}

function loadBag() {
  fetch("/api/cart")
    .then(res => res.json())
    .then(cart => {
      if (!bagItemsDiv) return;

      bagItemsDiv.innerHTML = "";
      let total = 0;

      if (cart.length === 0) {
        bagEmpty?.classList.remove("hidden");
        bagItemsDiv.classList.add("hidden");
        updateCheckoutTotal(0);
        return;
      }

      bagEmpty?.classList.add("hidden");
      bagItemsDiv.classList.remove("hidden");

      cart.forEach((item, index) => {
        const quantity = Number(item.quantity) || 1;
        total += item.price * quantity;

        const div = document.createElement("div");
        div.className = "bag-item";

        const removeBtnContent = quantity > 1
          ? "−"
          : `<img src="images/shared/trashCan.png" alt="Remove" />`;

        div.innerHTML = `
          <div class="bag-item-main">
            <img class="bag-item-img" src="${item.image || "images/shared/drink-img-filler.png"}" alt="${item.name}" />
            <div class="bag-item-info">
              <p class="bag-item-name">${item.name}</p>
              <p class="bag-item-mods">${formatItemDetails(item)}</p>
              <p class="bag-item-price">$${item.price.toFixed(2)}</p>
            </div>
          </div>
          <div class="bag-item-actions">
            <div class="bag-qty-control">
              <button type="button" class="bag-qty-btn bag-qty-remove" data-index="${index}" aria-label="${quantity > 1 ? "Decrease quantity" : "Remove item"}">${removeBtnContent}</button>
              <span class="bag-qty-count">${quantity}</span>
              <button type="button" class="bag-qty-btn bag-qty-add" data-index="${index}" aria-label="Increase quantity">+</button>
            </div>
            <button type="button" class="bag-edit-btn" data-index="${index}">Edit</button>
          </div>
        `;

        div.querySelector(".bag-qty-remove").addEventListener("click", () => {
          if (quantity > 1) {
            updateQuantity(index, quantity - 1);
          } else {
            removeItem(index);
          }
        });

        div.querySelector(".bag-qty-add").addEventListener("click", () => {
          updateQuantity(index, quantity + 1);
        });

        div.querySelector(".bag-edit-btn").addEventListener("click", () => {
          editItem(index, item);
        });

        bagItemsDiv.appendChild(div);
      });

      updateCheckoutTotal(total);
    });
}

async function updateQuantity(index, quantity) {
  const res = await fetch(`/api/cart/${index}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity }),
  });

  if (!res.ok) {
    console.error("Failed to update quantity");
    return;
  }

  loadBag();
}

async function removeItem(index) {
  await fetch(`/api/cart/${index}`, { method: "DELETE" });
  loadBag();
}

function editItem(index, item) {
  const customizeOverlay = document.getElementById("customize-overlay");

  if (customizeOverlay && typeof openCustomizeModalForEdit === "function") {
    closeBag();
    openCustomizeModalForEdit(item.productId, index, item);
    return;
  }

  window.location.href = `menu.html?customize=${encodeURIComponent(item.productId)}&edit=${index}`;
}

let pickupDays = [];

const daySelect = document.getElementById("pickup-day-select");
const timeSelect = document.getElementById("pickup-time-select");
const pickupSlotHint = document.getElementById("pickup-slot-hint");
const checkoutItemsDiv = document.getElementById("checkout-items");

function showPickupHint(message) {
  if (!pickupSlotHint) return;
  if (message) {
    pickupSlotHint.textContent = message;
    pickupSlotHint.classList.remove("hidden");
  } else {
    pickupSlotHint.textContent = "";
    pickupSlotHint.classList.add("hidden");
  }
}

function formatDayLabel(day) {
  return `${capitalize(day.dayName)}, ${formatDate(day.date)}`;
}

function renderDaySelect(days) {
  if (!daySelect) return;

  daySelect.innerHTML = '<option value="">Select a Day</option>';

  days.forEach(day => {
    const option = document.createElement("option");
    option.value = day.date;
    const isUnavailable = day.closed || day.fullyBooked;
    option.textContent = isUnavailable
      ? `${formatDayLabel(day)} — Fully booked`
      : formatDayLabel(day);
    option.disabled = isUnavailable;
    if (isUnavailable) option.className = "pickup-option--full";
    daySelect.appendChild(option);
  });

  const hasBookableDay = days.some(d => !d.closed && !d.fullyBooked);

  if (!days.length) {
    showPickupHint("No pickup days available in the next 7 days.");
    daySelect.disabled = true;
    return;
  }

  if (!hasBookableDay) {
    showPickupHint("All pickup days in the next 7 days are fully booked.");
    daySelect.disabled = true;
    return;
  }

  daySelect.disabled = false;
  showPickupHint("");
}

function parseTimeForSort(timeStr) {
  const [time, period] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function sortSlotsByTime(slots) {
  return [...slots].sort((a, b) => parseTimeForSort(a.time) - parseTimeForSort(b.time));
}

function renderTimeSelect(day) {
  if (!timeSelect) return;

  timeSelect.innerHTML = '<option value="">--:-- AM</option>';
  timeSelect.disabled = true;

  if (!day || day.closed) return;

  sortSlotsByTime(day.available).forEach(slot => {
    const option = document.createElement("option");
    option.value = slot.time;
    option.textContent = slot.full ? `${slot.time} — Full` : slot.time;
    option.disabled = slot.full;
    if (slot.full) option.className = "pickup-option--full";
    timeSelect.appendChild(option);
  });

  const hasOpenSlot = day.available.some(slot => !slot.full);
  timeSelect.disabled = !hasOpenSlot;

  if (!hasOpenSlot) {
    showPickupHint("All times for this day are full.");
  } else {
    showPickupHint("");
  }
}

function onDayChange() {
  if (!daySelect || !timeSelect) return;

  const selected = pickupDays.find(d => d.date === daySelect.value);
  renderTimeSelect(selected);
}

if (daySelect) {
  daySelect.addEventListener("change", onDayChange);
}

function renderCheckoutItems(cart) {
  if (!checkoutItemsDiv) return;

  checkoutItemsDiv.innerHTML = "";

  cart.forEach(item => {
    const div = document.createElement("div");
    div.className = "checkout-item";
    div.innerHTML = `
      <div class="bag-item-main">
        <img class="bag-item-img" src="${item.image || "images/shared/drink-img-filler.png"}" alt="${item.name}" />
        <div class="bag-item-info">
          <p class="bag-item-name">${item.name}</p>
          <p class="bag-item-mods">${formatItemDetails(item)}</p>
          <p class="bag-item-price">$${item.price.toFixed(2)}</p>
        </div>
      </div>
    `;
    checkoutItemsDiv.appendChild(div);
  });
}

async function generatePickupTimes() {
  const [slotsRes, cartRes] = await Promise.all([
    fetch("/api/slots"),
    fetch("/api/cart"),
  ]);

  pickupDays = await slotsRes.json();
  const cart = await cartRes.json();

  renderDaySelect(pickupDays);
  renderCheckoutItems(cart);

  if (timeSelect) {
    timeSelect.innerHTML = '<option value="">--:-- AM</option>';
    timeSelect.disabled = true;
  }
}

async function checkout() {
  if (!daySelect || !timeSelect) return;

  const pickupDate = daySelect.value;
  const pickupTime = timeSelect.value;

  if (!pickupDate || !pickupTime) {
    alert("Please select a pickup time");
    return;
  }

  const day = pickupDays.find(d => d.date === pickupDate);
  const slot = day?.available.find(s => s.time === pickupTime);

  if (!day || !slot || slot.full) {
    alert("Please select an available pickup time");
    return;
  }

  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pickupDate, pickupTime }),
  });

  const { checkoutUrl, error } = await res.json();
  if (error) return alert(error);
  window.location.href = checkoutUrl;
}

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function showPickupTime() {
  setBagView("pickup");
  generatePickupTimes();
}

function showCart() {
  openBag();
}

function openShadowBox() {
  document.getElementById("shadow-overlay").style.display = "block";
  document.getElementById("shadow-box").style.display = "block";

  setTimeout(() => {
    document.getElementById("shadow-box").classList.add("active");
  }, 10);
}

function closeShadowBox() {
  document.getElementById("shadow-box").classList.remove("active");

  setTimeout(() => {
    document.getElementById("shadow-overlay").style.display = "none";
    document.getElementById("shadow-box").style.display = "none";
  }, 200);
}

function toggleMenu() {
  const menu = document.getElementById("mobileMenu");
  menu.classList.toggle("active");
}

window.openBag = openBag;
window.closeBag = closeBag;
window.loadBag = loadBag;
window.removeItem = removeItem;
window.checkout = checkout;
window.showPickupTime = showPickupTime;
window.showCart = showCart;
