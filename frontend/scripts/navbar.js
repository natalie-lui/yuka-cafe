(function initNavbarScroll() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  const threshold = 12;
  const isMenuPage = Boolean(document.querySelector('.menu-page'));

  function updateNavbarScroll() {
    const scrolled = window.scrollY > threshold;
    navbar.classList.toggle('navbar--scrolled', scrolled);

    if (isMenuPage) {
      document.body.classList.toggle('menu-scrolled', scrolled);
    }
  }

  window.addEventListener('scroll', updateNavbarScroll, { passive: true });
  updateNavbarScroll();
})();
