const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

let currentDrink = null;

//fetch drink from backend
if(productId){
  fetch(`/api/drinks/${productId}`)
    .then(res => {
      if (!res.ok) {
        throw new Error("Drink not found");
      }
      return res.json();
    })
    .then(drink => {
      currentDrink = drink;

      document.getElementById("drink-name").textContent = drink.name;
      document.getElementById("drink-price").textContent = `$${drink.price.toFixed(2)}`;
      document.getElementById("drink-description").textContent = drink.description;

      const imgEl = document.getElementById("drink-image");

      imgEl.src = drink.image 
        ? drink.image 
        : "images/drink-img-filler.png";

      imgEl.alt = drink.name;

      // -------- RENDER MODIFIERS --------
      const container = document.getElementById("modifiers-container");
      container.innerHTML = "";

      drink.modifiers.forEach(list => {

        const fieldset = document.createElement("fieldset");
        fieldset.className = "adjust-field";

        const legend = document.createElement("legend");
        legend.textContent = list.name;
        fieldset.appendChild(legend);

        list.options.forEach((opt, index) => {

          const label = document.createElement("label");

          label.innerHTML = `
            <input type="radio"
                  name="${list.name}"
                  value="${opt.name}"
                  data-price="${opt.price}"
                  ${index === 0 ? "checked" : ""}>
            ${opt.name} ${opt.price ? `(+$${opt.price})` : ""}
          `;

          fieldset.appendChild(label);
        });

        container.appendChild(fieldset);
      });
    })
    .catch(err => {
      console.error(err);
      document.body.innerHTML = "<h1>Drink not found</h1>";
    });
  } else {
  console.warn("No product ID found in URL.");
}

function showCartPopup(item) {
  const overlay = document.getElementById("cart-popup-overlay");
  const details = document.getElementById("popup-item-details");

  // Build modifier string
  const mods = Object.entries(item.modifiers)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");

  details.innerHTML = `
    <h2><b>${item.name}</b></h2>
    <p>${mods}</p>
    <p>Price: $${item.price.toFixed(2)}</p>
  `;

  overlay.classList.remove("hidden");
}

//add to order
let currItem = {};

function addToCart() {
  if (!currItem || !currentDrink) return;

  const selectedModifiers = {};
  let modifierPriceTotal = 0;

  // Loop through all modifier groups
  document.querySelectorAll("#modifiers-container fieldset").forEach(field => {
    const legend = field.querySelector("legend").textContent;
    const checked = field.querySelector("input:checked");

    if (checked) {
      const price = Number(checked.dataset.price || 0);
      selectedModifiers[legend] = checked.value;
      modifierPriceTotal += price;
    }
  });

  // Final price includes base + modifier prices
  const finalPrice = currentDrink.price + modifierPriceTotal;

  const cartItem = {
    productId: currentDrink.id,
    name: currentDrink.name,
    price: finalPrice,
    modifiers: selectedModifiers
  };

  // Send to backend
  fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cartItem)
  })
  .then(res => res.json())
  .then(data => {
    showCartPopup(cartItem); // show popup
    console.log("Added to cart:", cartItem);
  })
  .catch(err => console.error("Cart error:", err));
}

// cart popup buttons
document.getElementById("continue-ordering").onclick = () => {
  document.getElementById("cart-popup-overlay").classList.add("hidden");
};

document.getElementById("go-to-bag").onclick = () => {
  document.getElementById("cart-popup-overlay").classList.add("hidden");
  showCart();
};