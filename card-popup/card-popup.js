/* =========================================================================
   pleko.es: business-card pop-up (homepage only: / and /en/)
   ---------------------------------------------------------------------
   The printed QR opens /v/bc/, which sends people here with the tags
   utm_source=business_card. Only then does a pop-up cover the page:
   the card turns once and the text round the QR unwinds into two lines.
   It remembers only in this browser (localStorage, one date, not a cookie):
   once seen, it stays away for DAYS days. Switching language inside the
   pop-up still works in the same tab (sessionStorage flag).
   Test links (only change your own browser):
     ?tarjeta=ya      show it now, ignoring the memory
     ?tarjeta=reset   forget it, as if new
   ========================================================================= */
(function () {
  'use strict';
  var KEY = 'pleko-card-seen', DAYS = 30;
  var q;
  try { q = new URLSearchParams(window.location.search); } catch (e) { return; }
  if (q.get('tarjeta') === 'reset') { try { localStorage.removeItem(KEY); sessionStorage.removeItem(KEY); } catch (e) {} return; }
  var testing = q.get('tarjeta') === 'ya';
  if (q.get('utm_source') !== 'business_card' && !testing) return;
  var seenUntil = 0, inTab = false;
  try { seenUntil = parseInt(localStorage.getItem(KEY), 10) || 0; inTab = sessionStorage.getItem(KEY) === '1'; } catch (e) {}
  if (!testing && seenUntil > Date.now() && !inTab) return;
  try { localStorage.setItem(KEY, String(Date.now() + DAYS * 864e5)); sessionStorage.setItem(KEY, '1'); } catch (e) {}

  var lang = (document.documentElement.lang || 'es').slice(0, 2) === 'en' ? 'en' : 'es';
  var UTM = '?utm_source=business_card&utm_medium=print&utm_campaign=networking';
  var T = {
    es: {
      label: 'Vienes de mi tarjeta',
      h: 'Sí, las tarjetas de papel siguen funcionando. Acabas de demostrarlo.',
      sub: 'Lo analógico abre la puerta; lo digital hace el resto. Así trabajo yo también.',
      wq: '¿Has tenido que girar la tarjeta para leerla?', wa: 'Así se siente un proceso confuso. Aquí lo simplifico.',
      ringA: 'Primero simplifico · luego automatizo ', ringB: 'Menos tareas repetitivas · más tiempo para tu negocio ',
      tag: 'Automatización e IA', replay: 'Ver otra vez', close: 'Cerrar',
      wapp: 'Escríbeme por WhatsApp', wappHref: 'https://wa.me/34656310631?text=Hola%20Alex%2C%20me%20pas%C3%B3%20tu%20tarjeta%3A%20',
      call: 'Reserva una llamada gratuita de 20 min', cal: 'pleko/llamada-gratuita',
      other: 'English', otherHref: '/en/' + UTM, aria: 'Tarjeta de visita de pleko, parte de atrás', dialog: 'Vienes de mi tarjeta'
    },
    en: {
      label: 'You came from my card',
      h: 'Yes, paper business cards still work. You’ve just proved it.',
      sub: 'Analogue opens the door; digital does the rest. That’s how I work too.',
      wq: 'Did you have to turn the card round to read it?', wa: 'That’s what a confusing process feels like. Here, I simplify it.',
      ringA: 'First I simplify · then I automate ', ringB: 'Fewer repetitive tasks · more time for your business ',
      tag: 'Automation and AI', replay: 'Watch again', close: 'Close',
      wapp: 'Message me on WhatsApp', wappHref: 'https://wa.me/34656310631?text=Hi%20Alex%2C%20I%20got%20your%20card%20from%3A%20',
      call: 'Book a free 20-min call', cal: 'pleko/free-call',
      other: 'Español', otherHref: '/' + UTM, aria: 'pleko business card, back', dialog: 'You came from my card'
    }
  }[lang];

  var RING = 'M90,360 L310,360 A50,50 0 0 0 360,310 L360,90 A50,50 0 0 0 310,40 L90,40 A50,50 0 0 0 40,90 L40,310 A50,50 0 0 0 90,360 Z';
  var BASE = 21.17, N = 110;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  var html =
    '<div class="cp-overlay" role="dialog" aria-modal="true" aria-labelledby="cp-h">' +
    '<div class="cp-dialog">' +
    '<button type="button" class="cp-x" aria-label="' + T.close + '">&times;</button>' +
    '<div class="cp-head">' +
    '<p class="section-label cp-label">' + T.label + '</p>' +
    '<h2 class="cp-h" id="cp-h">' + T.h + '</h2>' +
    '<p class="cp-sub">' + T.sub + '</p></div>' +
    '<div class="cp-visual"><div class="cp-scene"><div class="cp-card" role="img" aria-label="' + T.aria + '">' +
      '<div class="cp-face cp-back">' +
        '<div class="cp-name">Alexandros Re<span class="cp-i">ï</span>zos</div>' +
        '<img class="cp-qr" src="/card-popup/qr.svg" alt="" width="290" height="290">' +
        '<svg class="cp-ring" viewBox="0 0 400 400" aria-hidden="true" focusable="false">' +
          '<path id="cp-ref" d="' + RING + '" fill="none"/><path id="cp-pa" fill="none"/><path id="cp-pb" fill="none"/>' +
          '<text id="cp-ma" style="visibility:hidden"></text><text id="cp-mb" style="visibility:hidden"></text>' +
          '<text id="cp-ta"><textPath href="#cp-pa" id="cp-tpa"></textPath></text>' +
          '<text id="cp-tb"><textPath href="#cp-pb" id="cp-tpb"></textPath></text>' +
        '</svg>' +
        '<div class="cp-contact"><span>alex@pleko.es</span><span>BCN</span><span>656 310 631</span></div>' +
      '</div>' +
      '<div class="cp-face cp-front"><img src="/pleko-logo.svg?v=2" alt="" width="314" height="116"><span class="cp-tag">' + T.tag + '</span></div>' +
    '</div></div>' +
    '<button type="button" class="cp-replay">' + T.replay + '</button></div>' +
    '<div class="cp-rest"><p class="cp-wink"><strong>' + T.wq + '</strong>' + T.wa + '</p>' +
    '<div class="cp-actions">' +
      '<a class="btn btn--primary" href="' + T.wappHref + '" target="_blank" rel="noopener" data-umami-event-location="card-popup">' + T.wapp + '</a>' +
      '<button type="button" class="btn btn--ghost" data-cal-link="' + T.cal + '" data-cal-config=\'{"layout":"month_view"}\' data-umami-event-location="card-popup">' + T.call + ' <span class="arrow">→</span></button>' +
    '</div>' +
    '<p class="cp-lang"><a href="' + T.otherHref + '" hreflang="' + (lang === 'es' ? 'en' : 'es') + '" lang="' + (lang === 'es' ? 'en' : 'es') + '">' + T.other + '</a></p></div>' +
    '</div></div>';

  var host = document.createElement('div');
  host.innerHTML = html;
  var overlay = host.firstChild;
  var prevFocus = document.activeElement;
  document.body.appendChild(overlay);
  document.body.classList.add('cp-lock');
  var dlg = overlay.querySelector('.cp-dialog');
  dlg.setAttribute('tabindex', '-1');
  var card = overlay.querySelector('.cp-card');
  var scene = overlay.querySelector('.cp-scene');
  var ring = overlay.querySelector('.cp-ring');
  var $ = function (id) { return document.getElementById(id); };

  // ---------- close ----------
  function close() {
    cancelAnimationFrame(raf);
    overlay.classList.remove('is-on');
    document.body.classList.remove('cp-lock');
    document.removeEventListener('keydown', onKey, true);
    setTimeout(function () { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 380);
    try { if (prevFocus && prevFocus.focus) prevFocus.focus(); } catch (e) {}
  }
  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    var f = dlg.querySelectorAll('a[href],button');
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  document.addEventListener('keydown', onKey, true);
  overlay.querySelector('.cp-x').addEventListener('click', close);
  overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) close(); });
  overlay.querySelector('.cp-actions').addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-cal-link]');
    if (b) { if (typeof window.plekoLoadCal === 'function') window.plekoLoadCal(); setTimeout(close, 60); }
  });
  requestAnimationFrame(function () { overlay.classList.add('is-on'); dlg.focus({ preventScroll: true }); });

  // ---------- animation ----------
  var ease = function (x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  var clamp = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var ref = $('cp-ref');
  var halves = null, S = 1, raf = 0, t0 = 0, curT = 0;
  var TEND = 3400;

  function setText(tp, text) {
    var tail = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
    tail.setAttribute('class', 'cp-tail'); tail.textContent = '·';
    // the trailing "·" of the ring text lives in a tspan so it can fade out when the line is straight
    tp.textContent = text.replace(/\s*·?\s*$/, '') + ' ';
    tp.appendChild(tail);
  }
  function build() {
    var ma = $('cp-ma'), mb = $('cp-mb');
    [ma, mb].forEach(function (m) { m.setAttribute('font-size', BASE); });
    ma.textContent = T.ringA.replace(/\s*·?\s*$/, '') + ' ·'; mb.textContent = T.ringB.replace(/\s*·?\s*$/, '') + ' ·';
    var wa = ma.getComputedTextLength(), wb = mb.getComputedTextLength();
    var L = ref.getTotalLength(), lenA = L * wa / (wa + wb), lenB = L - lenA;
    setText($('cp-tpa'), T.ringA); setText($('cp-tpb'), T.ringB);
    halves = [mk(0, lenA, wa, 'a', 0), mk(lenA, lenB, wb, 'b', 1)];
    layout();
  }
  function mk(s0, len, w, id, idx) {
    var pts = [], i;
    for (i = 0; i <= N; i++) { var p = ref.getPointAtLength(Math.min(s0 + len * i / N, ref.getTotalLength())); pts.push(p); }
    var ch = [], th = [], prev = null;
    for (i = 0; i < N; i++) {
      var dx = pts[i + 1].x - pts[i].x, dy = pts[i + 1].y - pts[i].y;
      var a = Math.atan2(dy, dx);
      if (prev !== null) { while (a - prev > Math.PI) a -= 2 * Math.PI; while (a - prev < -Math.PI) a += 2 * Math.PI; }
      else if (idx === 0) { a = 0; }
      else { while (a > 0) a -= 2 * Math.PI; if (a < -Math.PI * 1.5) a += 2 * Math.PI; }
      th.push(a); prev = a; ch.push(Math.sqrt(dx * dx + dy * dy));
    }
    return { len: len, w: w, p0: pts[0], ch: ch, th: th, path: $('cp-p' + id), text: $('cp-t' + id), tp: $('cp-tp' + id), n: $('cp-tp' + id).textContent.length, tail: null, ax: 0, ay: 0, fl: 0 };
  }
  function layout() {
    if (!halves) return;
    var k = (card.offsetWidth * 40 / 61) / 400 || 1;
    var stageW = scene.clientWidth || 300;
    var longest = Math.max(halves[0].len, halves[1].len);
    S = Math.max(1, Math.min(2.1, 0.95 * stageW / (longest * k)));
    var yA = 745, yB = yA + BASE * S * 1.7;
    halves.forEach(function (h, i) {
      h.ax = 200 - h.len * S / 2; h.ay = i === 0 ? yA : yB; h.fl = h.len * S / N;
      h.tail = h.tp.querySelector('.cp-tail');
    });
  }
  function drawHalf(h, r) {
    var g = ease(r), x = lerp(h.p0.x, h.ax, g), y = lerp(h.p0.y, h.ay, g), total = 0, d = 'M' + x.toFixed(2) + ',' + y.toFixed(2);
    for (var i = 0; i < N; i++) {
      var u = ease(clamp(r * 1.6 - 0.6 * (i / (N - 1))));
      var th = h.th[i] * (1 - u), step = h.ch[i] * (1 - u) + h.fl * u;
      x += step * Math.cos(th); y += step * Math.sin(th); total += step;
      d += 'L' + x.toFixed(2) + ',' + y.toFixed(2);
    }
    var fs = BASE * (1 + (S - 1) * g);
    var nat = h.w * fs / BASE;
    h.path.setAttribute('d', d);
    h.text.setAttribute('font-size', fs.toFixed(2));
    h.text.setAttribute('letter-spacing', ((total - nat) / h.n).toFixed(3));
    if (h.tail) h.tail.setAttribute('fill-opacity', (1 - clamp((r - 0.85) / 0.15)).toFixed(2));
  }
  function render(t) {
    curT = t;
    var a = ease(clamp(t / 2200)), bump = Math.sin(Math.PI * clamp(t / 2200));
    card.style.transform = 'rotateY(' + (a * 360).toFixed(2) + 'deg) scale(' + (1 + 0.06 * bump).toFixed(3) + ')';
    drawHalf(halves[0], clamp((t - 1100) / 1700));
    drawHalf(halves[1], clamp((t - 1600) / 1700));
  }
  function frame(now) {
    var t = now - t0;
    render(Math.min(t, TEND));
    if (t < TEND) raf = requestAnimationFrame(frame);
  }
  function play() {
    cancelAnimationFrame(raf);
    if (reduce) { render(TEND); return; }
    render(0);
    t0 = performance.now() + 350;
    raf = requestAnimationFrame(function tick(now) { if (now < t0) { raf = requestAnimationFrame(tick); return; } frame(now); });
  }
  overlay.querySelector('.cp-replay').addEventListener('click', play);
  window.addEventListener('resize', function () { layout(); if (halves) render(curT); });
  window.__cpSeek = function (t) { cancelAnimationFrame(raf); render(t); };   // used by tests only

  var fontsReady = (document.fonts && document.fonts.load) ? document.fonts.load('500 21px Inter').catch(function () {}) : Promise.resolve();
  fontsReady.then(function () { build(); play(); });
})();
