/* =========================================================================
   Cookie consent + Microsoft Clarity (heatmaps and session recordings)
   -------------------------------------------------------------------------
   Umami (cookie-free) is NOT affected and keeps running for everyone.
   Clarity's script is not even downloaded until the visitor presses
   Accept. The choice is kept 6 months in localStorage (not a cookie).
   A "Cookies" link is added to the footer to change it at any time.

   Not shown / not loaded:
   - pages with noindex (hidden previews), except the two privacy pages
   - browsers excluded with ?nocount=1 (same switch as Umami)
   - while CLARITY_ID is empty

   The book-a-call card (corner-card.js) waits for an answer: it asks
   window.plekoConsent.pending() and listens for the "pleko:consent" event.
   Test: ?consent=reset clears the stored choice.
   Docs: learn.microsoft.com/en-ca/clarity/clarity-consent-api-v2
   ========================================================================= */
(function () {
  'use strict';

  var CLARITY_ID = '';            // Clarity > Settings > Overview > Project ID
  var KEY = 'pleko.consent';      // {"v":"granted|denied","until":<ms>}
  var REMEMBER_DAYS = 182;

  var path = location.pathname;
  var lang = document.documentElement.lang === 'en' ? 'en' : 'es';
  var robots = document.querySelector('meta[name="robots"]');
  var isPrivacy = path === '/privacidad/' || path === '/en/privacy/';
  var hidden = robots && /noindex/i.test(robots.content) && !isPrivacy;
  var excluded = false;
  try { excluded = localStorage.getItem('umami.disabled') === '1'; } catch (e) {}
  if (/[?&]nocount=1/.test(location.search)) excluded = true;

  var T = {
    es: {
      text: 'Uso Microsoft Clarity para ver dónde se hace clic y cómo se navega por la web, y así mejorarla. No ve lo que escribes y solo se activa si aceptas.',
      more: 'Más info', moreHref: '/privacidad/#cookies',
      yes: 'Aceptar', no: 'Rechazar', label: 'Aviso de cookies', footer: 'Cookies'
    },
    en: {
      text: "I use Microsoft Clarity to see where people click and how they move through the site, so I can improve it. It can't see what you type and only switches on if you accept.",
      more: 'More info', moreHref: '/en/privacy/#cookies',
      yes: 'Accept', no: 'Reject', label: 'Cookie notice', footer: 'Cookies'
    }
  }[lang];

  function read() {
    try {
      var c = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (c && c.until > Date.now()) return c.v;
    } catch (e) {}
    return null;
  }
  function save(v) {
    try { localStorage.setItem(KEY, JSON.stringify({ v: v, until: Date.now() + REMEMBER_DAYS * 864e5 })); } catch (e) {}
  }
  if (/[?&]consent=reset/.test(location.search)) { try { localStorage.removeItem(KEY); } catch (e) {} }

  var active = !!CLARITY_ID && !hidden && !excluded;
  var choice = read();
  var bar = null;

  window.plekoConsent = {
    pending: function () { return active && !choice; },
    open: openBar
  };

  /* ---------- Clarity: standard loader, then the consent signal */
  var loaded = false;
  function loadClarity() {
    if (loaded) return;
    loaded = true;
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', CLARITY_ID);
    window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' });
  }

  function decide(v) {
    var before = choice;
    choice = v;
    save(v);
    if (v === 'granted') loadClarity();
    else if (before === 'granted' && window.clarity) {
      // Withdrawn: tell Clarity, which deletes its cookies and stops
      window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' });
      window.clarity('consent', false);
    }
    closeBar();
    try { document.dispatchEvent(new CustomEvent('pleko:consent', { detail: v })); } catch (e) {}
    if (window.umami && typeof window.umami.track === 'function') {
      window.umami.track('consent', { choice: v === 'granted' ? 'accept' : 'reject' });
    }
  }

  /* ---------- Banner */
  var css =
    '.pk-consent{position:fixed;left:max(1.5rem,env(safe-area-inset-left));bottom:max(1.5rem,env(safe-area-inset-bottom));z-index:31;width:360px;max-width:calc(100vw - 2rem);' +
      'background:#fcf9f8 url(/paper.png);border:1px solid #bdc9c8;border-radius:16px;padding:1rem 1.1rem;' +
      'box-shadow:0 10px 30px rgba(11,61,61,.12);color:#1b1c1c;font-family:Inter,system-ui,sans-serif;' +
      'opacity:0;transform:translateY(12px);transition:opacity .3s ease,transform .3s ease;visibility:hidden}' +
    '.pk-consent.is-open{opacity:1;transform:none;visibility:visible}' +
    '.pk-consent__text{font-size:.86rem;line-height:1.5;color:#3e4949;margin:0 0 .75rem}' +
    '.pk-consent__text a{color:#006565;text-decoration:underline;text-underline-offset:3px;white-space:nowrap}' +
    '.pk-consent__text i{display:inline-block;width:6px;height:6px;border-radius:50%;background:#cc5500;margin-right:.45rem;vertical-align:.1em}' +
    '.pk-consent__acts{display:flex;gap:.5rem}' +
    '.pk-consent__btn{flex:1;min-height:44px;padding:0 1rem;border-radius:12px;font:600 .92rem Inter,system-ui,sans-serif;cursor:pointer;' +
      'border:1.5px solid #006565;background:transparent;color:#006565}' +
    '.pk-consent__btn:hover{background:#e1f5ee}' +
    '.pk-consent :focus-visible{outline:2px solid #006565;outline-offset:2px}' +
    'body.pk-consent-open .floating{opacity:0;pointer-events:none}' +
    '.footer-links .pk-consent-link{background:none;border:0;padding:.35rem 0;font:inherit;color:#3e4949;cursor:pointer}' +
    '.footer-links .pk-consent-link:hover{color:#006565}' +
    '@media (max-width:600px){.pk-consent{left:.75rem;right:.75rem;bottom:max(.75rem,env(safe-area-inset-bottom));width:auto;max-width:none;padding:.85rem .9rem}' +
      '.pk-consent__text{font-size:.82rem;margin-bottom:.6rem}}' +
    '@media (prefers-reduced-motion:reduce){.pk-consent{transition:none;transform:none}}' +
    '@media print{.pk-consent{display:none}}';

  function build() {
    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);
    bar = document.createElement('section');
    bar.className = 'pk-consent';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', T.label);
    bar.innerHTML =
      '<p class="pk-consent__text"><i aria-hidden="true"></i>' + T.text + ' <a href="' + T.moreHref + '">' + T.more + '</a></p>' +
      '<div class="pk-consent__acts">' +
        '<button type="button" class="pk-consent__btn" data-v="denied">' + T.no + '</button>' +
        '<button type="button" class="pk-consent__btn" data-v="granted">' + T.yes + '</button>' +
      '</div>';
    Array.prototype.forEach.call(bar.querySelectorAll('button'), function (b) {
      b.addEventListener('click', function () { decide(b.getAttribute('data-v')); });
    });
    document.body.appendChild(bar);
  }

  function openBar() {
    if (!active) return;
    if (!bar) build();
    requestAnimationFrame(function () {
      bar.classList.add('is-open');
      document.body.classList.add('pk-consent-open');
    });
  }
  function closeBar() {
    if (!bar) return;
    bar.classList.remove('is-open');
    document.body.classList.remove('pk-consent-open');
  }

  function addFooterLink() {
    var nav = document.querySelector('.footer-links');
    if (!nav || nav.querySelector('.pk-consent-link')) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'pk-consent-link';
    b.textContent = T.footer;
    b.addEventListener('click', openBar);
    nav.appendChild(b);
  }

  function start() {
    if (!active) return;
    addFooterLink();
    if (choice === 'granted') loadClarity();
    else if (!choice) openBar();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
