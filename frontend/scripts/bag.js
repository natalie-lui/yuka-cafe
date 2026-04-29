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
async function generatePickupTimes() {
  const select = document.getElementById("pickup-time-select");
  select.innerHTML = "";

  // find the next Friday, Saturday, or Sunday
  function getNextWeekendDate() {
    const d = new Date();
    d.setDate(d.getDate() + 1); // start from tomorrow
    while (true) {
      const day = d.getDay(); // 0=Sun, 5=Fri, 6=Sat
      if (day === 0 || day === 5 || day === 6) break;
      d.setDate(d.getDate() + 1);
    }
    const year  = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day   = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const date = getNextWeekendDate();
  const res = await fetch(`/api/slots?date=${date}`);
  const { available, closed } = await res.json();

  // format date nicely for the label
  const label = new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric"
  });

  if (closed || !available.length) {
    const opt = document.createElement("option");
    opt.textContent = "No slots available this weekend";
    opt.disabled = true;
    select.appendChild(opt);
    return;
  }

  available.forEach(slot => {
    const opt = document.createElement("option");
    opt.value = JSON.stringify({ date, time: slot.time });
    opt.textContent = `${label} at ${slot.time} (${slot.remaining} left)`;
    select.appendChild(opt);
  });
}

// then in your checkout() function, parse it back out:
async function checkout() {
  const select = document.getElementById("pickup-time-select");
  const { date, time } = JSON.parse(select.value);

  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pickupDate: date, pickupTime: time })
  });

  const { checkoutUrl, error } = await res.json();
  if (error) return alert(error); // "Slot is full — please pick another time"
  window.location.href = checkoutUrl;
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