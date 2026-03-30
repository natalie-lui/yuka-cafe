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

      //RENDER IMGS
      const imgEl = document.getElementById("drink-image");
      const thumbnailColumn = document.getElementById("thumbnail-col");

      // fallback if no images
      const images = (drink.images && drink.images.length)
        ? drink.images
        : ["images/drink-img-filler.png"];

      // set default main image
      imgEl.src = images[0];
      imgEl.alt = drink.name;

      // render thumbnails
      thumbnailColumn.innerHTML = "";

      images.forEach((img, index) => {
        const thumb = document.createElement("img");
        thumb.src = img;
        thumb.className = "thumbnail";

        // highlight first one
        if (index === 0) thumb.classList.add("active");

        thumb.addEventListener("click", () => {
          // update main image
          imgEl.src = img;

          // update active state
          document.querySelectorAll(".thumbnail").forEach(t =>
            t.classList.remove("active")
          );
          thumb.classList.add("active");
        });

        thumbnailColumn.appendChild(thumb);
      });

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
  const img = document.getElementById("popup-item-image");

  // set img
  img.src = item.image || "images/drink-img-filler.png";
  img.alt = item.name;

  // Build modifier string
  const mods = Object.entries(item.modifiers || {})
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
  const note = document.getElementById("custom-note").value;

  const cartItem = {
    productId: currentDrink.id,
    name: currentDrink.name,
    price: finalPrice,
    modifiers: selectedModifiers,
    note: note,
    image: currentDrink.image || currentDrink.images?.[0] //for popup
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