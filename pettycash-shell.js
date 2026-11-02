/* Navigation decoration only. Native Bootstrap and Power Pages own authentication/menus. */
(function (root) {
  'use strict';
  const document = root.document;
  function setHeight() {
    const navbar = document.getElementById('navbar'), header = document.getElementById('pcSiteHeader');
    if (navbar) {
      const top = navbar.getBoundingClientRect().top;
      const headerTop = header?.getBoundingClientRect().top || 0;
      navbar.style.maxHeight = Math.max(120, root.innerHeight - (top > headerTop ? top : headerTop + 78) - 24) + 'px';
    }
  }
  // Existing Bootstrap toggle's inline handler calls this named function.
  root.setHeight = setHeight;
  function initialize() {
    const header = document.getElementById('pcSiteHeader');
    if (!header || header.dataset.initialized === 'true') return;
    header.dataset.initialized = 'true';
    const avatar = header.querySelector('.pc-user-avatar'), username = header.querySelector('.username');
    if (avatar && username) avatar.textContent = (Array.from(username.textContent.trim())[0] || '•').toLocaleUpperCase();
    const currentPath = root.location.pathname.replace(/\/+$/, '').toLowerCase() || '/';
    for (const link of header.querySelectorAll('li.weblink > a, li.weblink .dropdown-menu a')) {
      if (!link.getAttribute('href') || link.getAttribute('href').startsWith('#')) continue;
      const url = new URL(link.href, root.location.origin);
      if (url.origin === root.location.origin && (url.pathname.replace(/\/+$/, '').toLowerCase() || '/') === currentPath) {
        link.setAttribute('aria-current', 'page');
        link.closest('li.weblink')?.classList.add('active');
      }
    }
    const skip = header.querySelector('.skip-to-content a');
    const target = document.getElementById('mainContent') || document.querySelector('main') || document.querySelector('[data-pc-page]');
    if (skip && target) {
      if (!target.id) target.id = 'pcMainContent';
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      skip.setAttribute('href', '#' + target.id);
    }
    header.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      const navbar = document.getElementById('navbar');
      if (!navbar || !navbar.classList.contains('show')) return;
      if (navbar.querySelector('.dropdown-menu.show')) return; // Native dropdown handles its own Escape first.
      const instance = root.bootstrap?.Collapse?.getInstance(navbar);
      if (instance) instance.hide();
      else navbar.classList.remove('show');
      const toggle = header.querySelector('[data-bs-target="#navbar"]');
      if (toggle) { toggle.setAttribute('aria-expanded', 'false'); toggle.focus(); }
    });
    setHeight();
  }
  root.addEventListener('resize', setHeight);
  root.addEventListener('load', function () {
    // Retain the original legacy-browser search behavior without replacing other onload handlers.
    if (root.navigator.appName === 'Microsoft Internet Explorer' || root.navigator.userAgent.indexOf('Trident') > 0) {
      document.getElementById('search')?.setAttribute('href', '');
    }
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
  else initialize();
})(window);
