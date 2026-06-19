function alignHeroToNav() {
  const orderBtn = document.querySelector(".navbar__order");
  const hero = document.querySelector(".hero");
  const heroArt = document.querySelector(".hero__art");

  if (!orderBtn || !hero || !heroArt) return;

  const isMobile = window.matchMedia("(max-width: 900px)").matches;

  if (isMobile) {
    heroArt.style.marginLeft = "";
    heroArt.style.width = "";
    return;
  }

  const heroRect = hero.getBoundingClientRect();
  const orderRect = orderBtn.getBoundingClientRect();

  const width = orderRect.left + orderRect.width / 2 - heroRect.left;

  if (width <= 0) return;

  heroArt.style.marginLeft = "";
  heroArt.style.width = `${width}px`;
}

function initHeroAlign() {
  alignHeroToNav();
  window.addEventListener("resize", alignHeroToNav);

  document.querySelector(".navbar__logo")?.addEventListener("load", alignHeroToNav);
  document.querySelector(".hero__img")?.addEventListener("load", alignHeroToNav);
  document.fonts?.ready?.then(alignHeroToNav);

  const navbar = document.querySelector(".navbar");
  if (navbar && "ResizeObserver" in window) {
    new ResizeObserver(alignHeroToNav).observe(navbar);
  }
}

initHeroAlign();
