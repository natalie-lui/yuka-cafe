function setFaqPaintOffset() {
  const faqMain = document.querySelector(".faq-main");
  if (!faqMain) return;

  faqMain.style.setProperty(
    "--faq-paint-offset",
    `${Math.ceil(faqMain.offsetTop)}px`
  );
}

function alignFaqNavPaint() {
  const paint = document.querySelector(".faq-nav-paint");
  const faqMain = document.querySelector(".faq-main");
  const widthAnchor =
    document.querySelector(".navbar__order") ||
    document.querySelector('.navbar__link[href="faq.html"]');

  if (!paint || !faqMain) return;

  setFaqPaintOffset();

  if (window.matchMedia("(max-width: 900px)").matches) {
    paint.style.width = "";
    paint.style.display = "none";
    return;
  }

  paint.style.display = "";

  if (widthAnchor) {
    const anchorLeft = widthAnchor.getBoundingClientRect().left;
    const mainRect = faqMain.getBoundingClientRect();
    const paintWidth = anchorLeft - mainRect.left + 48;

    if (paintWidth > 0) {
      paint.style.width = `${Math.ceil(paintWidth)}px`;
    }
  }
}

function initFaqNavPaint() {
  alignFaqNavPaint();
  window.addEventListener("resize", alignFaqNavPaint);

  document.querySelector(".navbar__logo")?.addEventListener("load", alignFaqNavPaint);
  document.fonts?.ready?.then(alignFaqNavPaint);

  const navbar = document.querySelector(".navbar");
  if (navbar && "ResizeObserver" in window) {
    new ResizeObserver(alignFaqNavPaint).observe(navbar);
  }
}

initFaqNavPaint();
