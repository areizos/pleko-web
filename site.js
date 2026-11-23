/* =========================================================================
   pleko.es — small interface touches, shared by every page
   ---------------------------------------------------------------------
   Plain JavaScript, no libraries. Each block is independent, so if one
   part can't run the rest of the page still works. Anyone who has asked
   their device to reduce motion gets no reveals, counters or drawing
   lines: everything is simply shown as it is.
   ========================================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var en = root.lang === 'en';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var phone = window.matchMedia('(max-width: 600px)');
  var header = document.querySelector('.site-header');

  var text = en
    ? { top: 'Back to top', whatsapp: 'Message me on WhatsApp', waText: 'Hi Alex, I found you on pleko.es. ' }
    : { top: 'Volver arriba', whatsapp: 'Escríbeme por WhatsApp', waText: 'Hola Alex, vengo de pleko.es. ' };

  /* ---------- Floating buttons: WhatsApp (phones only) and back to top --- */
  var floating = document.createElement('div');
  floating.className = 'floating';
  floating.innerHTML =
    '<a class="floating__btn floating__btn--wa" href="https://wa.me/34656310631?text=' + encodeURIComponent(text.waText) + '" target="_blank" rel="noopener" aria-label="' + text.whatsapp + '">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 11.6a8.5 8.5 0 0 1-12.6 7.5L3.5 20.5l1.5-4.2a8.5 8.5 0 1 1 15.5-4.7z"/><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.6-2-1-1 .8a4.5 4.5 0 0 1-2.2-2.2l.8-1-1-2z"/></svg>' +
    '</a>' +
    '<button class="floating__btn floating__btn--top" type="button" aria-label="' + text.top + '">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>' +
    '</button>';
  document.body.appendChild(floating);
  var waBtn = floating.querySelector('.floating__btn--wa');
  var topBtn = floating.querySelector('.floating__btn--top');
  // On the 404 page and similar short pages there is no point in either.
  var hasBooking = !!document.querySelector('.contact');
  if (!hasBooking) waBtn.remove();

  topBtn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    var brand = document.querySelector('.brand');
    if (brand) brand.focus({ preventScroll: true });
  });

  /* ---------- Reading progress line along the bottom of the menu bar ----- */
  var progress = document.createElement('span');
  progress.className = 'site-header__progress';
  progress.setAttribute('aria-hidden', 'true');
  if (header) header.appendChild(progress);

  /* ---------- Everything that reacts to scrolling ------------------------
     Frosted bar + shadow once scrolled, progress line, menu bar that slides
     away on phones while scrolling down and returns on the way up, and the
     two floating buttons that appear after the first screen. */
  var lastY = window.scrollY;
  var ticking = false;

  function onScroll() {
    ticking = false;
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var screen = window.innerHeight;

    if (header) {
      header.classList.toggle('is-scrolled', y > 8);
      progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';

      var goingDown = y > lastY + 4;
      var goingUp = y < lastY - 4;
      var keepOpen = header.contains(document.activeElement);
      if (phone.matches && goingDown && y > 160 && !keepOpen) header.classList.add('is-hidden');
      else if (goingUp || y < 160 || !phone.matches) header.classList.remove('is-hidden');
    }

    floating.classList.toggle('show-top', y > screen * 1.5);
    floating.classList.toggle('show-wa', y > screen * 0.8 && !contactInView);

    if (Math.abs(y - lastY) > 4) lastY = y;
    sweepPassed();
  }

  // Safety net for big jumps (a menu link, a link to /#reserva): anything the
  // page has already scrolled past is shown at once instead of waiting.
  var pending = [];
  function sweepPassed() {
    if (!pending.length) return;
    pending = pending.filter(function (item) {
      if (item.el.getBoundingClientRect().top < 0) { item.show(); return false; }
      return true;
    });
  }

  function requestScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onScroll);
    }
  }

  window.addEventListener('scroll', requestScroll, { passive: true });
  window.addEventListener('resize', requestScroll, { passive: true });

  var hasIO = 'IntersectionObserver' in window;

  /* ---------- "Book a call" button in the menu bar -----------------------
     Appears once the hero's own booking button has scrolled out of view
     (on pages without a hero, after a short scroll), and steps aside while
     the booking section itself is on screen. */
  var headerCta = document.querySelector('.header-cta');
  var heroCta = document.querySelector('.hero__cta');
  var contact = document.querySelector('.contact');
  var heroPassed = false;
  var contactInView = false;

  function updateCta() {
    if (!headerCta) return;
    var show = heroPassed && !contactInView;
    header.classList.toggle('show-cta', show);
    if (show) {
      headerCta.removeAttribute('tabindex');
      headerCta.removeAttribute('aria-hidden');
    } else {
      headerCta.setAttribute('tabindex', '-1');
      headerCta.setAttribute('aria-hidden', 'true');
    }
  }

  if (hasIO && headerCta) {
    if (heroCta && !document.querySelector('.not-found')) {
      new IntersectionObserver(function (entries) {
        var e = entries[0];
        heroPassed = !e.isIntersecting && e.boundingClientRect.top < 0;
        updateCta();
      }).observe(heroCta);
    } else {
      window.addEventListener('scroll', function () {
        var passed = window.scrollY > 240;
        if (passed !== heroPassed) { heroPassed = passed; updateCta(); }
      }, { passive: true });
    }
  }

  if (hasIO && contact) {
    new IntersectionObserver(function (entries) {
      contactInView = entries[0].isIntersecting;
      updateCta();
      requestScroll();
    }, { threshold: 0.15 }).observe(contact);
  }

  /* ---------- "Recursos" dropdown in the menu ---------------------------
     A <details>: closes on a click outside it or on Escape. */
  var menuMore = document.querySelector('.menu-more');
  if (menuMore) {
    document.addEventListener('click', function (e) {
      if (menuMore.open && !menuMore.contains(e.target)) menuMore.open = false;
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuMore.open) {
        menuMore.open = false;
        menuMore.querySelector('summary').focus();
      }
    });
  }

  /* ---------- Current section underlined in the menu --------------------- */
  var menuLinks = Array.prototype.slice.call(document.querySelectorAll('.menu a[href^="#"]'));
  if (hasIO && menuLinks.length) {
    var byId = {};
    menuLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var link = byId[e.target.id];
        if (!link) return;
        if (e.isIntersecting) {
          menuLinks.forEach(function (a) { a.classList.remove('is-active'); a.removeAttribute('aria-current'); });
          link.classList.add('is-active');
          link.setAttribute('aria-current', 'location');
        } else if (link.classList.contains('is-active')) {
          link.classList.remove('is-active');
          link.removeAttribute('aria-current');
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    Object.keys(byId).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) sectionObserver.observe(section);
    });
  }

  /* ---------- Gentle reveal as sections come into view -------------------
     Headings, cards and steps rise a few pixels and fade in, once. Items in
     the same row follow each other by 80 ms, left to right. Anything already
     on screen when the page opens is left alone, so nothing flickers. */
  var revealGroups = [
    '.section-head', '.pains__intro', '.diagnostic__inner', '.about__inner > .section-label',
    '.about__photo', '.about__intro-text > .h2', '.about__text', '.stats', '.name-note', '.ideas__inner',
    '.contact__copy', '.faq__group', '.promises > .section-label', '.not-found__art',
    '.services__more', '.pieces', '.callout', '.subpage-text', '.checklist', '.glossary__group'
  ];
  var revealRows = ['.pains__grid > li', '.cards > .card', '.tools > .tools__row', '.steps > .step', '.promises__grid > .promise'];

  if (hasIO && !reduceMotion) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        revealObserver.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    var prepare = function (el, delay) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) return; // already visible
      el.classList.add('reveal');
      if (delay) el.style.setProperty('--reveal-delay', delay + 'ms');
      revealObserver.observe(el);
      pending.push({ el: el, show: function () { el.classList.add('is-in'); revealObserver.unobserve(el); } });
    };

    revealGroups.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) { prepare(el, 0); });
    });
    revealRows.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        var i = Array.prototype.indexOf.call(el.parentNode.children, el);
        prepare(el, Math.min(i, 5) * 80);
      });
    });
    root.classList.add('js-reveal');
  }

  /* ---------- Numbers that count up once when seen ----------------------- */
  var counters = document.querySelectorAll('[data-count]');
  if (hasIO && !reduceMotion && counters.length) {
    var countUp = function (el) {
      if (el.getAttribute('data-counted')) return;
      el.setAttribute('data-counted', '1');
      countObserver.unobserve(el);
      var target = parseInt(el.getAttribute('data-count'), 10);
      var start = null;
      var duration = Math.min(400 + target * 60, 1400);
      var step = function (t) {
        if (start === null) start = t;
        var p = Math.min((t - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(target * eased));
        if (p < 1) window.requestAnimationFrame(step);
      };
      window.requestAnimationFrame(step);
    };
    var countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) countUp(e.target); });
    }, { threshold: 0.6 });
    counters.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) return;
      el.textContent = '0';
      countObserver.observe(el);
      pending.push({ el: el, show: function () { countUp(el); } });
    });
  }

  /* ---------- Booking calendar and questionnaire load when needed --------
     Cal.com and Tally are fetched after the page has finished loading, or
     straight away if someone heads for one of their buttons first. */
  var calButtons = document.querySelectorAll('[data-cal-link]');
  function loadCal() {
    if (typeof window.plekoLoadCal === 'function') window.plekoLoadCal();
  }

  var tallyState = 'idle'; // idle → loading → ready
  var tallyWaiting = [];
  function loadTally(callback) {
    if (callback) tallyWaiting.push(callback);
    if (tallyState === 'ready') return flushTally();
    if (tallyState === 'loading') return;
    tallyState = 'loading';
    var s = document.createElement('script');
    s.src = 'https://tally.so/widgets/embed.js';
    s.async = true;
    s.onload = function () { tallyState = 'ready'; flushTally(); };
    s.onerror = function () { tallyState = 'failed'; flushTally(); };
    document.head.appendChild(s);
  }
  function flushTally() {
    var waiting = tallyWaiting;
    tallyWaiting = [];
    waiting.forEach(function (fn) { fn(); });
  }

  // The questionnaire buttons are plain links to the form; with Tally loaded
  // they open it in a pop-up over the page instead.
  document.querySelectorAll('[data-tally-form]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      if (event.metaKey || event.ctrlKey || event.shiftKey) return; // new tab: let the link work
      event.preventDefault();
      var open = function () {
        if (window.Tally && typeof window.Tally.openPopup === 'function') {
          window.Tally.openPopup(link.getAttribute('data-tally-form'), {
            layout: 'modal',
            width: 640,
            hiddenFields: utm
          });
        } else {
          window.location.href = link.href;
        }
      };
      loadTally(open);
    });
    ['pointerenter', 'focus', 'touchstart'].forEach(function (type) {
      link.addEventListener(type, function () { loadTally(); }, { passive: true, once: true });
    });
  });

  calButtons.forEach(function (btn) {
    ['pointerenter', 'focus', 'touchstart'].forEach(function (type) {
      btn.addEventListener(type, loadCal, { passive: true, once: true });
    });
  });

  if (hasIO && contact) {
    var nearContact = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { loadCal(); nearContact.disconnect(); }
    }, { rootMargin: '600px 0px' });
    nearContact.observe(contact);
  }

  function whenIdle(fn) {
    if ('requestIdleCallback' in window) window.requestIdleCallback(fn, { timeout: 4000 });
    else window.setTimeout(fn, 2000);
  }
  function afterLoad() {
    whenIdle(function () {
      if (calButtons.length) loadCal();
      if (document.querySelector('[data-tally-form]')) loadTally();
    });
  }
  if (document.readyState === 'complete') afterLoad();
  else window.addEventListener('load', afterLoad);

  /* ---------- The pieces: one meaning open at a time ---------------------- */
  /* Service examples: show a 1.5-line peek, open and close on click. */
  document.querySelectorAll('.card__examples').forEach(function (box) {
    var body = box.querySelector('.card__examples-body');
    var btn = box.querySelector('.card__examples-toggle');
    if (!body || !btn) return;
    function set(open) {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? btn.dataset.open : btn.dataset.closed;
      if (open) {
        box.classList.remove('is-folded');
        body.style.maxHeight = body.scrollHeight + 'px';
      } else {
        body.style.maxHeight = body.scrollHeight + 'px';
        void body.offsetHeight;
        box.classList.add('is-folded');
        body.style.maxHeight = '';
      }
    }
    body.addEventListener('transitionend', function () {
      if (!box.classList.contains('is-folded')) body.style.maxHeight = 'none';
    });
    btn.hidden = false;
    box.classList.add('is-folded');
    set(false);
    btn.addEventListener('click', function () { set(box.classList.contains('is-folded')); });
    body.addEventListener('click', function () { if (box.classList.contains('is-folded')) set(true); });
  });

  /* Service cards on phones and tablets: a swipeable row with dots, and one
     gentle nudge to the left the first time it comes into view. */
  var track = document.querySelector('.cards--services');
  var dotsBox = document.querySelector('.cards-dots');
  if (track && dotsBox) {
    var cards = Array.prototype.slice.call(track.children);
    var isRow = function () { return track.scrollWidth > track.clientWidth + 4; };
    var dots = cards.map(function (card, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.tabIndex = -1;
      b.addEventListener('click', function () {
        track.scrollTo({ left: card.offsetLeft - cards[0].offsetLeft, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
      dotsBox.appendChild(b);
      return b;
    });
    var markDot = function () {
      var x = track.scrollLeft, best = 0;
      cards.forEach(function (c, i) {
        if (Math.abs(c.offsetLeft - cards[0].offsetLeft - x) < Math.abs(cards[best].offsetLeft - cards[0].offsetLeft - x)) best = i;
      });
      if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 4) best = cards.length - 1;
      dots.forEach(function (d, i) { d.setAttribute('aria-current', i === best ? 'true' : 'false'); });
    };
    track.addEventListener('scroll', markDot, { passive: true });
    markDot();
    if (hasIO && !reduceMotion) {
      var nudgeSeen = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting || !isRow() || track.scrollLeft > 0) return;
        nudgeSeen.disconnect();
        window.setTimeout(function () {
          track.classList.add('is-nudging');
          window.setTimeout(function () { track.classList.remove('is-nudging'); }, 1500);
        }, 400);
      }, { threshold: 0.6 });
      nudgeSeen.observe(track);
    }
  }

  var pieces = Array.prototype.slice.call(document.querySelectorAll('.piece'));
  pieces.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (!d.open) return;
      pieces.forEach(function (o) { if (o !== d) o.open = false; });
    });
  });

  /* Hovering a pill tips it, and the pills around it (left, right, above,
     below), a little further the opposite way to their resting tilt. */
  var mm = window.matchMedia;
  var tiltOk = mm && mm('(hover: hover) and (pointer: fine)').matches &&
    !mm('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.pieces').forEach(function (list) {
    if (!tiltOk) return;
    var items = Array.prototype.slice.call(list.children);
    function baseTilt(li, i) {
      var t = parseFloat(getComputedStyle(li).getPropertyValue('--tilt')) || 0;
      return t || (i % 2 ? 1 : -1) * 0.01; /* untilted pills pick a side */
    }
    function nudge(li, i, deg) {
      li.style.setProperty('--nudge', (baseTilt(li, i) > 0 ? -deg : deg) + 'deg');
    }
    function clear() { items.forEach(function (li) { li.style.removeProperty('--nudge'); }); }
    function rowNeighbour(li, dir) {
      /* nearest pill in the row above (-1) or below (1) under this one's middle */
      var mid = li.offsetLeft + li.offsetWidth / 2, best = null, bestTop = null;
      items.forEach(function (o) {
        var dy = (o.offsetTop - li.offsetTop) * dir;
        if (dy <= 8 || mid < o.offsetLeft || mid > o.offsetLeft + o.offsetWidth) return;
        if (bestTop === null || dy < bestTop) { best = o; bestTop = dy; }
      });
      return best;
    }
    items.forEach(function (li, i) {
      li.addEventListener('mouseenter', function () {
        clear();
        nudge(li, i, 2);
        [items[i - 1], items[i + 1], rowNeighbour(li, -1), rowNeighbour(li, 1)].forEach(function (o) {
          if (o && o !== li) nudge(o, items.indexOf(o), 1);
        });
      });
    });
    list.addEventListener('mouseleave', clear);
  });

  /* ---------- Blog: filter the post list by topic ------------------------ */
  document.querySelectorAll('.tag-filter').forEach(function (bar) {
    var list = bar.parentNode.querySelector('.post-list');
    if (!list) return;
    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('.tag-filter__btn');
      if (!btn) return;
      var tag = btn.getAttribute('data-tag');
      bar.querySelectorAll('.tag-filter__btn').forEach(function (b) {
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });
      Array.prototype.forEach.call(list.children, function (li) {
        var tags = (li.getAttribute('data-tags') || '').split(' ');
        li.hidden = !!tag && tags.indexOf(tag) === -1;
      });
    });
  });

  /* ---------- Don't count my own visits: open any page with ?nocount=1
     (or ?nocount=0 to count again). Umami skips browsers with this flag. */
  (function () {
    var m = /[?&]nocount=([01])/.exec(location.search);
    if (!m) return;
    try {
      if (m[1] === '1') localStorage.setItem('umami.disabled', '1');
      else localStorage.removeItem('umami.disabled');
      alert(m[1] === '1' ? 'Listo: este navegador ya no cuenta en las estadísticas.' : 'Listo: este navegador vuelve a contar en las estadísticas.');
    } catch (e) {}
  })();

  /* ---------- Where a visitor came from (UTM tags), cookie-free -----------
     Links under /v/ send people here with utm_source / utm_medium /
     utm_campaign. They are kept in sessionStorage (gone when the tab
     closes), copied into any hidden form field with the same name, passed
     on to the booking calendar and questionnaire, and then removed from the
     address bar. Umami has already read the full address by the time the
     page has loaded, so it still sees them. */
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign'];
  var utm = {};
  var hadUtm = false;
  try {
    var q = new URLSearchParams(window.location.search);
    UTM_KEYS.forEach(function (k) {
      var v = q.get(k);
      if (v) { sessionStorage.setItem(k, v.slice(0, 100)); hadUtm = true; }
    });
    UTM_KEYS.forEach(function (k) {
      var v = sessionStorage.getItem(k);
      if (v) utm[k] = v;
    });
  } catch (e) {}
  var hasStoredUtm = Object.keys(utm).length > 0;

  function fillUtmInputs() {
    UTM_KEYS.forEach(function (k) {
      if (!utm[k]) return;
      document.querySelectorAll('input[name="' + k + '"]').forEach(function (input) { input.value = utm[k]; });
    });
  }
  function tagLink(a) {
    var host = '';
    try { host = new URL(a.href).hostname; } catch (e) { return; }
    if (!/(^|\.)(cal\.com|tally\.so|typeform\.com)$/.test(host)) return;
    var url = new URL(a.href);
    UTM_KEYS.forEach(function (k) { if (utm[k] && !url.searchParams.has(k)) url.searchParams.set(k, utm[k]); });
    a.href = url.toString();
  }
  if (hasStoredUtm) {
    fillUtmInputs();
    document.querySelectorAll('a[href]').forEach(tagLink);
    // Cal.com buttons: the booking card reads data-cal-config when it opens
    document.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('[data-cal-link]');
      if (!btn) return;
      try {
        var cfg = JSON.parse(btn.getAttribute('data-cal-config') || '{}');
        UTM_KEYS.forEach(function (k) { if (utm[k]) cfg[k] = utm[k]; });
        btn.setAttribute('data-cal-config', JSON.stringify(cfg));
      } catch (err) {}
    }, true);
  }
  if (hadUtm) {
    window.addEventListener('load', function () {
      // Keep any other query values; drop only the three UTM tags. The
      // original History method is used on purpose: Umami hooks the page's
      // own replaceState and would count a second page view.
      var p = new URLSearchParams(window.location.search);
      UTM_KEYS.forEach(function (k) { p.delete(k); });
      var rest = p.toString();
      try {
        History.prototype.replaceState.call(window.history, window.history.state, '', window.location.pathname + (rest ? '?' + rest : '') + window.location.hash);
      } catch (err) {}
    });
  }

  /* ---------- Umami events (cookie-free stats) ---------------------------
     Every key click is sent with a "location" (the part of the page it was
     in). Event names: click-diagnostico, click-contacto, click-whatsapp,
     toggle-language, expand-faq, click-founder-bio, click-guia, download-guia (the signup-guia event is sent by the guide form page itself). */
  function umTrack(name, data) {
    if (typeof window.umami === 'undefined' || !window.umami.track) return null;
    data = data || {};
    data.lang = root.lang;
    return window.umami.track(name, data);
  }
  function placeOf(el) {
    var own = el.closest('[data-umami-event-location]');
    if (own) return own.getAttribute('data-umami-event-location');
    var own2 = el.closest('[data-location]');
    if (own2) return own2.getAttribute('data-location');
    if (el.closest('.site-header')) return 'header';
    if (el.closest('.site-footer')) return 'footer';
    if (el.closest('.corner-card, .pcard')) return 'corner-card';
    if (el.closest('.hero, .subpage-hero')) return 'hero';
    if (el.closest('.case-study, [id^="caso"], [id^="case"]')) return 'case-study';
    if (el.closest('#servicios, #services, .services')) return 'services';
    if (el.closest('.contact')) return 'contact';
    if (el.closest('.faq')) return 'faq';
    if (el.closest('.pains')) return 'diagnostic';
    return 'page';
  }

  document.addEventListener('click', function (e) {
    if (!e.target.closest) return;
    var el = e.target.closest('a, button, summary');
    if (!el) return;
    var href = el.getAttribute('href') || '';

    if (el.tagName === 'SUMMARY') {
      var item = el.parentElement;
      if (item && item.classList.contains('faq__item') && !item.open) {
        umTrack('expand-faq', { question: el.textContent.trim().slice(0, 80) });
      }
      return;
    }
    if (href.indexOf('/guia-7-hilos/') === 0 || href.indexOf('/en/7-loose-threads-guide/') === 0) {
      // links to the guide sign-up page (e.g. the box inside a blog post)
      if (href.indexOf('/revisa-tu-email') < 0 && href.indexOf('/gracias') < 0 && href.indexOf('/thanks') < 0 && href.indexOf('/check-your-inbox') < 0) { umTrack('click-guia', { location: placeOf(el) }); return; }
    }
    if (href.indexOf('/descargas/') === 0) { umTrack('download-guia', { location: placeOf(el), file: href.split('?')[0].split('/').pop() }); return; }
    if (href.indexOf('/v/areizos') === 0) { umTrack('click-founder-bio', { location: placeOf(el) }); return; }

    if (el.closest('.lang-toggle') && el.tagName === 'A' && !el.hasAttribute('aria-current')) {
      var plain = !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button);
      var sent = umTrack('toggle-language', { to: en ? 'es' : 'en' });
      if (plain && sent && sent.then) {
        // Same-tab navigation can cancel a request that is still in flight, so wait briefly.
        e.preventDefault();
        var target = el.href, go = false;
        var leave = function () { if (!go) { go = true; window.location.href = target; } };
        sent.then(leave, leave);
        window.setTimeout(leave, 500);
      }
      return;
    }

    var name = el.hasAttribute('data-tally-form') ? 'click-diagnostico' :
      href.indexOf('wa.me/') !== -1 ? 'click-whatsapp' :
      (el.hasAttribute('data-cal-link') || href.indexOf('mailto:') === 0 || href.indexOf('#reserva') !== -1 || href.indexOf('#book') !== -1) ? 'click-contacto' : '';
    if (name) umTrack(name, { location: placeOf(el) });
  });

  /* Scroll depth: 50 % and 90 % of the page, each once per page load */
  (function () {
    var marks = [50, 90], done = {}, waiting = false;
    function check() {
      waiting = false;
      if (typeof window.umami === 'undefined') return;
      var total = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
      var pct = (window.scrollY + window.innerHeight) / total * 100;
      marks.forEach(function (m) {
        if (pct >= m && !done[m]) {
          done[m] = true;
          window.umami.track('scroll-depth', { depth: m + '%' });
        }
      });
    }
    window.addEventListener('scroll', function () {
      if (!waiting) { waiting = true; window.requestAnimationFrame(check); }
    }, { passive: true });
  })();

  /* ---------- Language switch keeps your place ---------------------------
     Switching ES ↔ EN while reading a section lands on the same section in
     the other language (and on the FAQ page, on the same question). */
  var sectionPairs = {
    servicios: 'services', 'como-trabajo': 'how-i-work', 'sobre-mi': 'about', ideas: 'ideas',
    preguntas: 'faq', reserva: 'book', diagnostico: 'diagnostic',
    'ia-con-cabeza': 'ai-with-judgement', piezas: 'pieces'
  };
  var faqItems = Array.prototype.slice.call(document.querySelectorAll('.faq--page .faq__item'));

  function currentPlace() {
    var line = window.innerHeight * 0.35;
    var found = null;
    var candidates = faqItems.length ? faqItems : document.querySelectorAll('main section[id]');
    Array.prototype.forEach.call(candidates, function (el) {
      if (el.getBoundingClientRect().top <= line) found = el;
    });
    return found;
  }

  document.querySelectorAll('.lang-toggle a:not([aria-current])').forEach(function (link) {
    link.addEventListener('click', function () {
      var linked = faqItems.length && location.hash ? document.getElementById(location.hash.slice(1)) : null;
      var place = linked && faqItems.indexOf(linked) !== -1 ? linked : (window.scrollY < 200 ? null : currentPlace());
      if (!place) return;
      var hash = '';
      if (faqItems.length) {
        hash = 'q' + (faqItems.indexOf(place) + 1);
      } else {
        var id = place.id;
        if (en) {
          Object.keys(sectionPairs).forEach(function (es) { if (sectionPairs[es] === id) hash = es; });
        } else {
          hash = sectionPairs[id] || '';
        }
      }
      if (hash) link.href = link.href.split('#')[0] + '#' + hash;
    });
  });

  /* ---------- Every FAQ question has its own link ------------------------
     Opening /preguntas-frecuentes/#q-pasa-con-datos (or #q13, used by the
     language switch) opens that answer; opening a question updates the
     address bar so it can be copied and shared. */
  function openFromHash() {
    if (!faqItems.length || !location.hash) return;
    var key = decodeURIComponent(location.hash.slice(1));
    var item = /^q\d+$/.test(key) ? faqItems[parseInt(key.slice(1), 10) - 1] : document.getElementById(key);
    if (!item || faqItems.indexOf(item) === -1) return;
    if (/^q\d+$/.test(key) && item.id) history.replaceState(null, '', '#' + item.id);
    item.open = true;
    item.scrollIntoView({ block: 'start', behavior: 'auto' });
  }

  faqItems.forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (item.open && item.id) history.replaceState(null, '', '#' + item.id);
      else if (!item.open && location.hash === '#' + item.id) history.replaceState(null, '', location.pathname);
    });
  });
  openFromHash();
  window.addEventListener('hashchange', openFromHash);

  /* ---------- Quick hours calculator (diagnostic band) -------------------
     People × hours a week × 46 working weeks, and that time at the hourly
     cost on the third slider (starts at 20 €, roughly the average cost of an
     hour of office work in Spain). */
  var calc = document.querySelector('.calc');
  if (calc) {
    var WEEKS = 46;
    var locale = calc.getAttribute('data-locale') || 'es-ES';
    var people = calc.querySelector('#calc-people');
    var hours = calc.querySelector('#calc-hours');
    var rate = calc.querySelector('#calc-rate');
    var totalOut = calc.querySelector('.calc__total');
    var moneyOut = calc.querySelector('.calc__money');
    var number = new Intl.NumberFormat(locale);
    var money = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
    var paint = function (input) {
      // fills the slider track up to the thumb
      var pct = (input.value - input.min) / (input.max - input.min) * 100;
      input.style.setProperty('--fill', pct + '%');
      calc.querySelector('.calc__value[data-for="' + input.id + '"]').textContent = input.value;
    };
    var update = function () {
      paint(people);
      paint(hours);
      paint(rate);
      var total = people.value * hours.value * WEEKS;
      totalOut.textContent = number.format(total);
      moneyOut.textContent = money.format(total * rate.value);
    };
    people.addEventListener('input', update);
    hours.addEventListener('input', update);
    rate.addEventListener('input', update);
    update();
    calc.hidden = false;
  }

  /* ---------- Printing shows every FAQ answer, then puts things back ----- */
  var openedForPrint = [];
  window.addEventListener('beforeprint', function () {
    document.querySelectorAll('details:not([open])').forEach(function (d) { d.open = true; openedForPrint.push(d); });
  });
  window.addEventListener('afterprint', function () {
    openedForPrint.forEach(function (d) { d.open = false; });
    openedForPrint = [];
  });

  onScroll();
})();
