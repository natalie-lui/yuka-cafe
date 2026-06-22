function alignHeroToNav() {
  const orderBtn = document.querySelector(".navbar__order");
  const faqLink = document.querySelector('.navbar__link[href="faq.html"]');
  const hero = document.querySelector(".hero");
  const heroArt = document.querySelector(".hero__art");
  const heroPaint = document.querySelector(".hero__paint");

  if (!hero) return;

  const isMobile = window.matchMedia("(max-width: 900px)").matches;

  if (isMobile) {
    if (heroArt) {
      heroArt.style.marginLeft = "";
      heroArt.style.width = "";
    }
    if (heroPaint) {
      heroPaint.style.width = "";
      heroPaint.style.display = "none";
    }
    return;
  }

  if (heroPaint) {
    heroPaint.style.display = "";
  }

  const heroRect = hero.getBoundingClientRect();

  if (orderBtn && heroArt) {
    const orderRect = orderBtn.getBoundingClientRect();
    const width = orderRect.left + orderRect.width / 2 - heroRect.left;

    if (width > 0) {
      heroArt.style.marginLeft = "";
      heroArt.style.width = `${width}px`;
    }
  }

  if (faqLink && heroPaint) {
    const faqRect = faqLink.getBoundingClientRect();
    const paintWidth = faqRect.right - heroRect.left;

    if (paintWidth > 0) {
      heroPaint.style.width = `${paintWidth}px`;
    }
  }
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
