const bagOverlay = document.getElementById("bag-overlay");
const panel = document.getElementById("bag-panel");
const pickupPanel = document.getElementById("pickup-view")
const bagItemsDiv = document.getElementById("bag-items");
const bagTotal = document.getElementById("bag-total");

//open bag
function openBag(){
    bagOverlay.classList.remove("hidden");
    setTimeout(() => bagOverlay.classList.add("show"), 10);
    loadBag();
}

//close bag
function closeBag() {
  bagOverlay.classList.add("hidden");
}

// click outside panel closes it
bagOverlay.addEventListener("click", () => {
  closeBag();
});


// prevent clicks inside panel from closing it
panel.addEventListener("click", (event) => {
  event.stopPropagation();
});

pickupPanel.addEventListener("click", (event) => {
  event.stopPropagation();
});

// Fetch cart from backend
function loadBag() {
  fetch("/api/cart")
    .then(res => res.json())
    .then(cart => {
      bagItemsDiv.innerHTML = "";
      let total = 0;

      cart.forEach((item, index) => {
        total += item.price;

        // Build modifier string dynamically
        const mods = item.modifiers
          ? Object.entries(item.modifiers)
              .map(([key, value]) => `${key}: ${value}`)
              .join(", ")
          : "";

        const div = document.createElement("div");
        div.className = "bag-item";
        div.innerHTML = `
          <img class="bag-item-img" src="${item.image || 'images/drink-img-filler.png'}"/>
          <div class="bag-item-text">
            <h2><b>${item.name}</b></h2>
            <p>${mods}</p>
            <p>$${item.price.toFixed(2)}</p>
          </div>
          <button class="delete-item" onclick="removeItem(${index})">✕</button>
        `;
        bagItemsDiv.appendChild(div);
      });

      bagTotal.textContent = `Total: $${total.toFixed(2)}`;
    });
}

// Remove item from cart
function removeItem(index) {
  fetch(`/api/cart/${index}`, { method: "DELETE" })
    .then(() => loadBag()); // refresh bag after deletion
}

//delete item
async function removeItem(index) {
  console.log("delete clicked", index);
  
  await fetch(`/api/cart/${index}`, {
    method: "DELETE"
  });

  loadBag(); // refresh bag UI
}

//checkout
async function checkout() {
  const pickupTime = document.getElementById("pickup-time-select").value;
  
  const res = await fetch("/api/checkout", { 
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pickupTime })
  });

  const data = await res.json();
  console.log(data);

  if (data.checkoutUrl) {
    window.location.href = data.checkoutUrl;
  } else {
    alert("Checkout failed");
  }
}


//show pickup times
let selectedDay = null;
let selectedSlot = null;

async function generatePickupTimes() {
  const res = await fetch("/api/slots");
  const days = await res.json();

  renderDayTabs(days);
  // default select first open slot
  const firstOpen = days.find(d => d.available?.some(s => s.remaining > 0));
  if (firstOpen) {
    selectedDay = firstOpen;
    renderSlots(firstOpen.available);
  }
}

function renderDayTabs(days) {
  const container = document.getElementById("day-tabs");
  container.innerHTML = "";

  days.forEach(day => {
    const allFull = day.available.every(s => s.remaining === 0);
    const tab = document.createElement("button");
    tab.className = "day-tab" + (allFull ? " closed" : "");
    tab.innerHTML = `
      <div class="day-label">${capitalize(day.dayName)}</div>
      <div class="day-date">${formatDate(day.date)}</div>
    `;
    if (!allFull) {
      tab.onclick = () => {
        selectedDay = day;
        selectedSlot = null;
        document.querySelectorAll(".day-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        renderSlots(day.available);
      };
    }
    container.appendChild(tab);
  });
}

function renderSlots(slots) {
  const grid = document.getElementById("slots-grid");
  grid.innerHTML = "";

  slots.forEach(slot => {
    const full = slot.remaining === 0;
    const btn = document.createElement("button");
    btn.className = "slot" + (full ? " full" : "");
    btn.innerHTML = `
      ${slot.time}
      <div class="slot-remaining">${full ? "full" : slot.remaining + " left"}</div>
    `;
    if (!full) {
      btn.onclick = () => {
        selectedSlot = slot;
        document.querySelectorAll(".slot").forEach(s => s.classList.remove("selected"));
        btn.classList.add("selected");
      };
    }
    grid.appendChild(btn);
  });
}


// then in your checkout() function, parse it back out:
async function checkout() {
  if (!selectedDay || !selectedSlot) {
    alert("Please select a pickup time");
    return;
  }

  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pickupDate: selectedDay.date,
      pickupTime: selectedSlot.time
    })
  });

  const { checkoutUrl, error } = await res.json();
  if (error) return alert(error);
  window.location.href = checkoutUrl;
}

//format dates
function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function showPickupTime() {
  document.getElementById("bag-panel").style.display = "none";
  document.getElementById("pickup-view").style.display = "block";
  generatePickupTimes();
}

function showCart() {
  document.getElementById("pickup-view").style.display = "none";
  document.getElementById("bag-panel").style.display = "block";
  openBag();
}

//merch popup
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

//mobile menu toggle
function toggleMenu() {
  const menu = document.getElementById("mobileMenu");
  menu.classList.toggle("active");
}