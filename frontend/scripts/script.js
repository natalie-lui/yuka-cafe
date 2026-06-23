const FEATURED_DRINK_NAMES = ['Hiroki', 'Yuka'];

//pull menu item from backend
async function loadDrinks() {
  try {
    const res = await fetch('/api/drinks');
    const drinks = await res.json();

    // target sections
    const featuredContainer = document.getElementById('featured-items');
    const matchaContainer = document.getElementById('matcha-items');
    const coffeeContainer = document.getElementById('coffee-items');

    // clear only the grids
    featuredContainer.innerHTML = '';
    matchaContainer.innerHTML = '';
    coffeeContainer.innerHTML = '';

    FEATURED_DRINK_NAMES.forEach(name => {
      const drink = drinks.find(d => d.name.toLowerCase() === name.toLowerCase());
      if (!drink) return;

      const link = document.createElement('a');
      link.className = 'featured-drink ft-drink-link';
      link.href = `customize.html?id=${drink.id}`;
      link.innerHTML = `
        <img class="featured-drink__img" src="${drink.image || '/images/shared/drink-img-filler.png'}" alt="${drink.name}">
        <span class="featured-drink__name">${drink.name}</span>
      `;
      featuredContainer.appendChild(link);
    });

    //sticker mapping
    const drinkStickers = {
        "Matcha Latte": {
            src: "images/menu/dino-sticker.png",
            top: "45%",
            left: "55%",
            width: "50%",
            rotate: "-5deg"
        },

        "Matcha Cloud": {
            src: "images/menu/olive-matcha-sticker.png",
            top: "-5%",
            left: "70%",
            width: "38%",
            rotate: "10deg"
        },

        "Yuka": {
            src: "images/menu/olive-strawberry-sticker.png",
            top: "45%",
            left: "65%",
            width: "50%",
            rotate: "-5deg"
        },
        
        "Banana Matcha": {
            src: "images/menu/smiski-sticker.png",
            top: "38%",
            left: "65%",
            width: "50%",
            rotate: "-5deg"
        }, 

        "Kuma": {
            src: "images/menu/kuma-sticker.png",
            top: "48%",
            left: "60%",
            width: "34%",
            rotate: "5deg"
        },

        "Capybara": {
            src: "images/menu/capybara-sticker.png",
            top: "-5%",
            left: "72%",
            width: "35%",
            rotate: "-5deg"
        },

        "Cookie Spice Latte": {
            src: "images/menu/cookie-sticker.png",
            top: "46%",
            left: "75%",
            width: "34%",
            rotate: "5deg"
        },

        "Build-Your-Own Latte": {
            src: "images/menu/latte-sticker.png",
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
        <img src="${drink.image || '/images/shared/drink-img-filler.png'}" alt="${drink.name}">
        <h3>${drink.name}</h3>
        <p class="menu-desc">${drink.description || ""}</p>
        <p class="menu-price">$${drink.price.toFixed(2)}</p>
      `;

      //pull sticker for drink
      const stickerInfo = drinkStickers[drink.name]

      if (stickerInfo) {
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
      }


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

    positionMenuSectionPaint();

      } catch (err) {
        console.error('Error loading drinks:', err);
      }
    }

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

// scroll to section + active tab state
const menuTabButtons = document.querySelectorAll('.menu-tabs button');

function updateMenuScrollOffset() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  let offset = navbar.getBoundingClientRect().height;

  const sidebar = document.querySelector('.menu-sidebar');
  if (window.matchMedia('(max-width: 768px)').matches && sidebar) {
    offset += sidebar.getBoundingClientRect().height;
  }

  document.documentElement.style.setProperty('--menu-scroll-offset', `${Math.ceil(offset)}px`);
}

function scrollToMenuSection(section) {
  updateMenuScrollOffset();

  const offset = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--menu-scroll-offset')
  ) || 0;

  const top = section.getBoundingClientRect().top + window.scrollY - offset;

  window.scrollTo({
    top,
    behavior: 'smooth',
  });
}

menuTabButtons.forEach(button => {
  button.addEventListener('click', () => {
    const id = button.dataset.target;
    const section = document.getElementById(id);
    if (!section) return;

    menuTabButtons.forEach(tab => tab.classList.remove('is-active'));
    button.classList.add('is-active');

    scrollToMenuSection(section);
  });
});

window.addEventListener('DOMContentLoaded', updateMenuScrollOffset);
window.addEventListener('resize', updateMenuScrollOffset);

function positionMenuNavPaint() {
  const paint = document.querySelector('.menu-nav-paint');
  const navbar = document.querySelector('.navbar');
  const widthAnchor = document.querySelector('.navbar__actions') || document.querySelector('.navbar__links .navbar__link[href="faq.html"]');
  if (!paint || !navbar || !widthAnchor) return;

  if (window.matchMedia('(max-width: 900px)').matches) {
    paint.style.width = '';
    paint.style.height = '';
    return;
  }

  const anchorRight = widthAnchor.getBoundingClientRect().left;
  const navbarBox = navbar.getBoundingClientRect();

  paint.style.width = `${Math.ceil(anchorRight + 24)}px`;
  paint.style.height = `${Math.ceil(navbarBox.bottom)}px`;
}

window.addEventListener('DOMContentLoaded', positionMenuNavPaint);
window.addEventListener('resize', positionMenuNavPaint);

function positionMenuSectionPaint() {
  const paint = document.querySelector('.menu-section-paint');
  const featured = document.getElementById('ft-drinks');
  const menuContent = document.querySelector('.menu-content');
  if (!paint || !featured || !menuContent) return;

  const boundary = menuContent.offsetTop + featured.offsetTop + featured.offsetHeight;
  paint.style.top = `${boundary}px`;
}

window.addEventListener('DOMContentLoaded', positionMenuSectionPaint);
window.addEventListener('resize', positionMenuSectionPaint);

const featuredSection = document.getElementById('ft-drinks');
if (featuredSection && 'ResizeObserver' in window) {
  const sectionPaintObserver = new ResizeObserver(positionMenuSectionPaint);
  sectionPaintObserver.observe(featuredSection);
}

function positionMenuGridPaints() {
  const menuContent = document.querySelector('.menu-content');
  if (!menuContent) return;

  const paintWidth = Math.ceil(menuContent.getBoundingClientRect().width);

  document.querySelectorAll('.menu-section--painted .menu-grid-paint').forEach(paint => {
    paint.style.setProperty('--menu-grid-paint-width', `${paintWidth}px`);
  });
}

window.addEventListener('DOMContentLoaded', positionMenuGridPaints);
window.addEventListener('resize', positionMenuGridPaints);