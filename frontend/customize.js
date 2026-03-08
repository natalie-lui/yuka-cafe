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
    })
    .catch(err => {
      console.error(err);
      document.body.innerHTML = "<h1>Drink not found</h1>";
    });
  } else {
  console.warn("No product ID found in URL.");
}

function addToCart(){
  const milk = document.querySelector('input[name="milk"]:checked').value;
  const sweetness = document.querySelector('input[name="sweetness"]:checked').value;
  const ice = document.querySelector('input[name="ice"]:checked').value;

  const cartItem = {
    productId,
    name: currentDrink.name,
    price: currentDrink.price,
    milk,
    sweetness,
    ice
  };

  fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cartItem)
  })
  .then(res => res.json())
  .then(data => {
    showCartPopup(cartItem);
  });
}

function showCartPopup(item) {
  const overlay = document.getElementById("cart-popup-overlay");
  const details = document.getElementById("popup-item-details");

  details.innerHTML = `
    <h2><b>${item.name}</b></h2>
    <p>${item.milk} milk, ${item.sweetness} sweetness, ${item.ice}</p>
  `;

  overlay.classList.remove("hidden");
}

// buttons
document.getElementById("continue-ordering").onclick = () => {
  document.getElementById("cart-popup-overlay").classList.add("hidden");
};

document.getElementById("go-to-bag").onclick = () => {
  document.getElementById("cart-popup-overlay").classList.add("hidden");
  showCart();
};

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