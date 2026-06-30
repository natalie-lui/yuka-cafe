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
      link.href = '#';
      link.addEventListener('click', (event) => {
        event.preventDefault();
        window.openCustomizeModal?.(drink.id);
      });
      link.innerHTML = `
        <img class="featured-drink__img" src="${drink.image || '/images/shared/drink-img-filler.png'}" alt="${drink.name}">
        <span class="featured-drink__name">${drink.name}</span>
      `;
      featuredContainer.appendChild(link);
    });

    drinks.forEach(drink => {
      const card = document.createElement('article');
      card.className = 'menu-card';

      card.innerHTML = `
        <img src="${drink.image || '/images/shared/drink-img-filler.png'}" alt="${drink.name}">
        <h3>${drink.name}</h3>
        <p class="menu-desc">${drink.description || ""}</p>
        <p class="menu-price">$${drink.price.toFixed(2)}</p>
      `;

      card.addEventListener('click', () => {
        window.openCustomizeModal?.(drink.id);
      });

      card.style.cursor = 'pointer';

      if (drink.category?.toLowerCase().includes('matcha')) {
        matchaContainer.appendChild(card);
      } else if (drink.category?.toLowerCase().includes('coffee')) {
        coffeeContainer.appendChild(card);
      }

    });

    positionMenuSectionPaint();
    positionMenuNavPaint();

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

function getFeaturedSectionPaintMetrics() {
  const menuPage = document.querySelector('.menu-page');
  const menuContent = document.querySelector('.menu-content');
  const featured = document.getElementById('ft-drinks');
  if (!menuPage || !menuContent || !featured) return null;

  const pullUp = menuPage.getBoundingClientRect().top + window.scrollY;
  const featuredEnd = menuContent.offsetTop + featured.offsetTop + featured.offsetHeight;

  return { pullUp, featuredEnd, totalHeight: pullUp + featuredEnd };
}

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
  const metrics = getFeaturedSectionPaintMetrics();
  const height = metrics ? metrics.totalHeight : Math.ceil(navbar.getBoundingClientRect().bottom);

  paint.style.width = `${Math.ceil(anchorRight + 24)}px`;
  paint.style.height = `${Math.ceil(height)}px`;
}

window.addEventListener('DOMContentLoaded', positionMenuNavPaint);
window.addEventListener('resize', positionMenuNavPaint);

function positionMenuSectionPaint() {
  const paint = document.querySelector('.menu-section-paint');
  const metrics = getFeaturedSectionPaintMetrics();
  if (!paint || !metrics) return;

  if (window.matchMedia('(max-width: 900px)').matches) {
    paint.style.top = '';
    paint.style.height = '';
    return;
  }

  paint.style.top = `${-metrics.pullUp}px`;
  paint.style.height = `${metrics.totalHeight}px`;
}

window.addEventListener('DOMContentLoaded', positionMenuSectionPaint);
window.addEventListener('resize', positionMenuSectionPaint);

const featuredSection = document.getElementById('ft-drinks');
if (featuredSection && 'ResizeObserver' in window) {
  const sectionPaintObserver = new ResizeObserver(() => {
    positionMenuSectionPaint();
    positionMenuNavPaint();
  });
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