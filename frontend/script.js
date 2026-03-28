//pull menu item from backend
async function loadDrinks() {
  try {
    const res = await fetch('/api/drinks');
    const drinks = await res.json();

    // target sections
    const matchaContainer = document.getElementById('matcha-items');
    const coffeeContainer = document.getElementById('coffee-items');

    // clear only the grids
    matchaContainer.innerHTML = '';
    coffeeContainer.innerHTML = '';

    //sticker mapping
    const drinkStickers = {
        "Matcha Latte": {
            src: "images/dino-sticker.png",
            top: "45%",
            left: "55%",
            width: "50%",
            rotate: "-5deg"
        },

        "Matcha Cloud": {
            src: "images/olive-matcha-sticker.png",
            top: "-5%",
            left: "70%",
            width: "38%",
            rotate: "10deg"
        },

        "Yuka": {
            src: "images/olive-strawberry-sticker.png",
            top: "45%",
            left: "65%",
            width: "50%",
            rotate: "-5deg"
        },
        
        "Banana Matcha": {
            src: "images/smiski-sticker.png",
            top: "38%",
            left: "65%",
            width: "50%",
            rotate: "-5deg"
        }, 

        "Kuma": {
            src: "images/kuma-sticker.png",
            top: "48%",
            left: "60%",
            width: "34%",
            rotate: "5deg"
        },

        "Capybara": {
            src: "images/capybara-sticker.png",
            top: "-5%",
            left: "72%",
            width: "35%",
            rotate: "-5deg"
        },

        "Cookie Spice Latte": {
            src: "images/cookie-sticker.png",
            top: "46%",
            left: "75%",
            width: "34%",
            rotate: "5deg"
        },

        "Build-Your-Own Latte": {
            src: "images/latte-sticker.png",
            top: "42%",
            left: "77%",
            width: "45%",
            rotate: "5deg"
        }
    }

    drinks.forEach(drink => {
      const card = document.createElement('article');
      card.className = 'menu-card';

      card.innerHTML = `
        <img src="${drink.image}" alt="${drink.name}">
        <h3>${drink.name}</h3>
        <p class="menu-desc">${drink.description || ""}</p>
        <p class="menu-price">$${drink.price.toFixed(2)}</p>
      `;

      //pull sticker for drink
      const stickerInfo = drinkStickers[drink.name]

        const sticker = document.createElement('img');
        sticker.src = stickerInfo.src;
        sticker.className = 'sticker';
        sticker.style.position = 'absolute';
        sticker.style.top = stickerInfo.top || '45%';
        sticker.style.left = stickerInfo.left || '55%';
        sticker.style.width = stickerInfo.width || '20%';
        sticker.style.transform = `rotate(${stickerInfo.rotate || '0deg'})`;
        sticker.style.pointerEvents = 'none';

        card.appendChild(sticker);


      card.addEventListener('click', () => {
        window.location.href = `customize.html?id=${drink.id}`;
      });

      card.style.cursor = 'pointer';

      if (drink.category?.toLowerCase().includes('matcha')) {
        matchaContainer.appendChild(card);
      } else if (drink.category?.toLowerCase().includes('coffee')) {
        coffeeContainer.appendChild(card);
      }

    });

  } catch (err) {
    console.error('Error loading drinks:', err);
  }
}

window.addEventListener('DOMContentLoaded', loadDrinks);

window.addEventListener('DOMContentLoaded', loadDrinks);

function openModal(name, price){
    currItem = {name, price};
    document.getElementById("modal-title").textContent = name;
    document.getElementById("modal-price").textContent = `$${price.toFixed(2)}`;
    document.getElementById("modal").classList.add("active");
}

function closeModal(){
    document.getElementById("modal").classList.remove("active");
}

//scroll to section
document.querySelectorAll('.menu-tabs button').forEach(button => {
  button.addEventListener('click', () => {
    const id = button.dataset.target;
    const section = document.getElementById(id);

    section.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
});