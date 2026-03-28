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
function generatePickupTimes() {
  const select = document.getElementById("pickup-time-select");
  select.innerHTML = "";

  const times = [
    "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM",
    "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM",
    "4:00 PM", "4:30 PM", "5:00 PM"
  ];

  times.forEach(t => {
    const option = document.createElement("option");
    option.value = t;
    option.textContent = `Tomorrow at ${t}`;
    select.appendChild(option);
  });
}

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