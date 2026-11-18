/* =========================================================================
   pleko.es — corner card ("Reservar llamada"; later also the PDF offer)
   ---------------------------------------------------------------------
   A small card in the lower right that invites a booking. Plain
   JavaScript, no libraries, no cookies. It remembers only for this visit
   (sessionStorage, cleared when the tab closes):
     - how many seconds you've spent on the site and how many pages you've
       opened, so it shows after SHOW_AFTER_SECONDS or on SHOW_ON_PAGE;
     - that it has already been shown, closed or used, so it shows once.
   After it is closed or used it also stays away for REMEMBER_DAYS on
   later visits (one date in localStorage, not a cookie).
   It never shows on legal pages, the demos or the 404 page, and it stays
   away while any booking button or block of the page is on screen.

   Test links (they only change your own browser):
     ?tarjeta=ya     show it now, skipping the wait
     ?tarjeta=reset  forget this visit and the 2 weeks, as if new
   ========================================================================= */
(function () {
  'use strict';

  var SHOW_AFTER_SECONDS = 45;
  var SHOW_ON_PAGE = 3;          // the 3rd page opened in the visit
  var PAGE_DELAY_SECONDS = 4;    // even then, never the moment a page opens
  var VARIANT = 'call';          // later: 'pdf'
  var REMEMBER_DAYS = 14;        // after closing or using it, away this long

  var SKIP_PATHS = [
    '/privacidad/', '/aviso-legal/', '/en/privacy/', '/en/legal-notice/',
    '/pruebalo/', '/en/try-it/'
  ];

  var VARIANTS = {
    call: {
      es: {
        label: 'Reservar una llamada',
        title: 'Antes de automatizar, desenredar.',
        body: 'Cuéntame tu proceso más enredado en 20 minutos y te digo por dónde empezaría yo.',
        button: 'Reservar llamada gratis',
        second: 'o escríbeme por WhatsApp',
        secondHref: 'https://wa.me/34656310631?text=' + encodeURIComponent('Hola Alex, vengo de pleko.es. '),
        close: 'Cerrar'
      },
      en: {
        label: 'Book a call',
        title: 'Untangle first, then automate.',
        body: "Tell me about your most tangled process in 20 minutes and I'll tell you where I'd start.",
        button: 'Book a free call',
        second: 'or message me on WhatsApp',
        secondHref: 'https://wa.me/34656310631?text=' + encodeURIComponent('Hi Alex, I found you on pleko.es. '),
        close: 'Close'
      }
    }
  };

  var lang = document.documentElement.lang === 'en' ? 'en' : 'es';
  var t = VARIANTS[VARIANT][lang];
  var KEY = 'pleko.card.' + VARIANT + '.';

  function get(k) { try { return sessionStorage.getItem(KEY + k); } catch (e) { return null; } }
  function set(k, v) { try { sessionStorage.setItem(KEY + k, String(v)); } catch (e) {} }
  // The 2-week memory lives in localStorage (not a cookie): one date, nothing personal
  function getUntil() { try { return parseInt(localStorage.getItem(KEY + 'until'), 10) || 0; } catch (e) { return 0; } }
  function remember() {
    set('done', 1);
    try { localStorage.setItem(KEY + 'until', String(Date.now() + REMEMBER_DAYS * 864e5)); } catch (e) {}
  }
  function track(action) {
    if (window.umami && window.umami.track) {
      window.umami.track('Tarjeta llamada', { accion: action, lang: lang, page: location.pathname });
    }
  }

  // Test links
  var test = (/[?&]tarjeta=(ya|reset)/.exec(location.search) || [])[1];
  if (test) {
    try {
      Object.keys(sessionStorage).forEach(function (k) {
        if (k.indexOf(KEY) === 0) sessionStorage.removeItem(k);
      });
      localStorage.removeItem(KEY + 'until');
    } catch (e) {}
  }

  // Pages where it never appears
  var path = location.pathname;
  var off = SKIP_PATHS.indexOf(path) !== -1 ||
    document.querySelector('meta[name="pleko-card"][content="off"]') ||
    /404/.test(document.title);
  if (off && test !== 'ya') return;

  // Anyone who books anywhere in this visit doesn't need the card
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('[data-cal-link]')) remember();
  });

  // Count this page once (a reload of the same page doesn't count)
  if (get('last') !== path) {
    set('pages', (parseInt(get('pages'), 10) || 0) + 1);
    set('last', path);
  }

  if ((get('done') || getUntil() > Date.now()) && test !== 'ya') return;

  /* ---------- Styles (moved into style.css when it goes on every page) */
  var css =
    '.pcard{position:fixed;right:max(1.5rem,env(safe-area-inset-right));bottom:max(1.5rem,env(safe-area-inset-bottom));z-index:30;width:340px;max-width:calc(100vw - 2rem);' +
      'background:#fff url(/paper.png);border:1px solid #bdc9c8;border-radius:16px;padding:1.25rem 1.25rem 1.1rem;' +
      'box-shadow:0 10px 30px rgba(11,61,61,.12);color:#1b1c1c;font-family:Inter,system-ui,sans-serif;' +
      'opacity:0;transform:translateY(16px);transition:opacity .35s ease,transform .35s ease;visibility:hidden}' +
    '.pcard.is-open{opacity:1;transform:none;visibility:visible}' +
    '.pcard__who{display:flex;gap:.75rem;align-items:center;margin:0 0 .6rem;padding-right:1.6rem}' +
    '.pcard__photo{width:44px;height:44px;border-radius:50%;object-fit:cover;flex:none}' +
    '.pcard__title{font-family:Literata,Georgia,serif;font-weight:600;font-size:1.19rem;line-height:1.25;margin:0;color:#006565}' +
    '.pcard__title i{display:inline-block;width:6px;height:6px;border-radius:50%;background:#cc5500;margin-left:3px;vertical-align:.45em}' +
    '.pcard__body{font-size:.92rem;line-height:1.5;color:#3e4949;margin:0 0 .9rem}' +
    '.pcard__acts{display:flex;align-items:center;gap:.4rem 1rem;flex-wrap:wrap}' +
    '.pcard__btn{display:inline-flex;align-items:center;gap:.5rem;min-height:44px;padding:0 1.1rem;border:0;border-radius:12px;background:#006565;color:#fff;font:600 .95rem Inter,system-ui,sans-serif;cursor:pointer}' +
    '.pcard__btn:hover{background:#004d4d}' +
    '.pcard__second{font-size:.82rem;color:#3e4949;text-decoration:underline;text-underline-offset:3px}' +
    '.pcard__second:hover{color:#006565}' +
    '.pcard__x{position:absolute;top:.5rem;right:.5rem;width:36px;height:36px;border:0;border-radius:50%;background:transparent;color:#3e4949;font-size:1.4rem;line-height:1;cursor:pointer}' +
    '.pcard__x:hover{background:#f0eded;color:#1b1c1c}' +
    '.pcard :focus-visible{outline:2px solid #006565;outline-offset:2px}' +
    'body.pcard-open .floating{opacity:0;pointer-events:none}' +
    '@media (max-width:600px){.pcard{left:.75rem;right:.75rem;bottom:max(.75rem,env(safe-area-inset-bottom));width:auto;max-width:none;padding:.9rem .9rem .85rem}' +
      '.pcard__who{margin-bottom:.45rem}.pcard__photo{width:38px;height:38px}.pcard__title{font-size:1.05rem}' +
      '.pcard__body{font-size:.86rem;margin-bottom:.7rem}}' +
    '@media (prefers-reduced-motion:reduce){.pcard{transition:none;transform:none}}' +
    '@media print{.pcard{display:none}}';

  var card = null;
  var shown = false;
  var wanted = false;            // time to show, waiting for booking buttons to leave the screen
  var contactVisible = false;

  function build() {
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    card = document.createElement('aside');
    card.className = 'pcard';
    card.setAttribute('aria-label', t.label);
    card.innerHTML =
      '<button type="button" class="pcard__x" aria-label="' + t.close + '">×</button>' +
      '<div class="pcard__who"><img class="pcard__photo" src="/alex-avatar.jpg" alt="" width="44" height="44" />' +
        '<p class="pcard__title">' + t.title + '</p></div>' +
      '<p class="pcard__body">' + t.body + '</p>' +
      '<div class="pcard__acts">' +
        '<button type="button" class="pcard__btn" data-cal-link="pleko" data-cal-config=\'{"layout":"month_view"}\'>' +
          t.button + ' <span class="arrow" aria-hidden="true">→</span></button>' +
        '<a class="pcard__second" href="' + t.secondHref + '" target="_blank" rel="noopener">' + t.second + '</a>' +
      '</div>';
    document.body.appendChild(card);

    card.querySelector('.pcard__x').addEventListener('click', function () { close('cerrar'); });
    card.querySelector('.pcard__btn').addEventListener('click', function () {
      track('reservar');
      if (typeof window.plekoLoadCal === 'function') window.plekoLoadCal();
      close();
    });
    card.querySelector('.pcard__second').addEventListener('click', function () { track('whatsapp'); close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && card.classList.contains('is-open')) close('cerrar');
    });
  }

  function open() {
    wanted = true;
    if (shown || contactVisible) return;
    shown = true;
    set('shown', 1);
    if (!card) build();
    requestAnimationFrame(function () {
      card.classList.add('is-open');
      document.body.classList.add('pcard-open');
    });
    track('vista');
  }

  function close(action) {
    if (!card) return;
    card.classList.remove('is-open');
    document.body.classList.remove('pcard-open');
    remember();
    if (action) track(action);
  }

  // While any booking button or block of the page itself is on screen, the
  // card stays away (and steps aside if already open). Counted: the
  // "Hablemos" band, every calendar button, and every "Reservar llamada"
  // link in the page. Not counted: the small button in the top menu bar,
  // which is on screen almost all the time.
  var BOOKING = '.contact, [data-cal-link], a[href*="#reserva"], a[href*="#book"], a[href*="cal.com/pleko"]';
  var onScreen = [];
  function refresh() {
    contactVisible = onScreen.length > 0;
    if (wanted && !shown && !contactVisible) return open();
    if (!card || get('done')) return;
    card.classList.toggle('is-open', shown && !contactVisible);
    document.body.classList.toggle('pcard-open', shown && !contactVisible);
  }
  if ('IntersectionObserver' in window) {
    var watcher = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var i = onScreen.indexOf(en.target);
        if (en.isIntersecting && i === -1) onScreen.push(en.target);
        if (!en.isIntersecting && i !== -1) onScreen.splice(i, 1);
      });
      refresh();
    });
    Array.prototype.forEach.call(document.querySelectorAll(BOOKING), function (el) {
      if (el.closest('.site-header, .pcard')) return;
      watcher.observe(el);
    });
  }

  // Already shown earlier in this visit: don't show again
  if (get('shown') && test !== 'ya') return;

  if (test === 'ya') {
    setTimeout(open, 600);
    return;
  }

  var pages = parseInt(get('pages'), 10) || 0;
  if (pages >= SHOW_ON_PAGE) {
    setTimeout(open, PAGE_DELAY_SECONDS * 1000);
  }

  // Seconds on the site, counted only while the tab is in front
  var seconds = parseInt(get('seconds'), 10) || 0;
  var timer = setInterval(function () {
    if (document.hidden) return;
    seconds += 1;
    set('seconds', seconds);
    if (seconds >= SHOW_AFTER_SECONDS) {
      clearInterval(timer);
      open();
    }
  }, 1000);
})();
