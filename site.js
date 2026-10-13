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
    '.about__inner > .h2', '.about__text', '.stats', '.name-note', '.ideas__inner',
    '.contact__copy', '.faq__group', '.promises > .section-label', '.not-found__art'
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
            width: 640
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

  /* ---------- Language switch keeps your place ---------------------------
     Switching ES ↔ EN while reading a section lands on the same section in
     the other language (and on the FAQ page, on the same question). */
  var sectionPairs = {
    servicios: 'services', 'como-trabajo': 'how-i-work', 'sobre-mi': 'about', ideas: 'ideas',
    preguntas: 'faq', reserva: 'book', diagnostico: 'diagnostic'
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
