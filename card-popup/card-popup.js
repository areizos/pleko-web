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
      h: 'Sí, las tarjetas de papel siguen funcionando. Acabas de demostrarlo.',
      parts: ['Sí, las tarjetas de papel', 'siguen funcionando.', 'Acabas de demostrarlo.'],
      tag: 'Automatización e IA', replay: 'Ver otra vez', close: 'Cerrar',
      other: 'English', otherHref: '/en/' + UTM, aria: 'Tarjeta de visita de pleko, parte de atrás'
    },
    en: {
      h: 'Yes, paper business cards still work. You\u2019ve just proved it.',
      parts: ['Yes, paper business cards', 'still work.', 'You\u2019ve just proved it.'],
      tag: 'Automation and AI', replay: 'Watch again', close: 'Close',
      other: 'Español', otherHref: '/' + UTM, aria: 'pleko business card, back'
    }
  }[lang];

  var RING = 'M90,360 L310,360 A50,50 0 0 0 360,310 L360,90 A50,50 0 0 0 310,40 L90,40 A50,50 0 0 0 40,90 L40,310 A50,50 0 0 0 90,360 Z';
  var BASE = 30, N = 90, NP = 3;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function parts(f) { var s = '', i; for (i = 0; i < NP; i++) s += f(i); return s; }
  var html =
    '<div class="cp-overlay" role="dialog" aria-modal="true" aria-labelledby="cp-h">' +
    '<div class="cp-dialog">' +
    '<button type="button" class="cp-x" aria-label="' + T.close + '">&times;</button>' +
    '<div class="cp-head">' +
    '<h2 class="sr-only" id="cp-h">' + T.h + '</h2>' +
    '</div>' +
    '<div class="cp-visual"><div class="cp-scene"><div class="cp-card" role="img" aria-label="' + T.aria + '">' +
      '<div class="cp-face cp-back">' +
        '<div class="cp-name">Alexandros Re<span class="cp-i">ï</span>zos</div>' +
        '<img class="cp-qr" src="/card-popup/qr.svg?v=2" alt="" width="290" height="290">' +
        '<svg class="cp-ring" viewBox="0 0 400 400" aria-hidden="true" focusable="false">' +
          '<path id="cp-ref" d="' + RING + '" fill="none"/>' + parts(function (i) {
            return '<path id="cp-p' + i + '" fill="none"/><text id="cp-m' + i + '" style="visibility:hidden"></text>' +
                   '<text id="cp-t' + i + '"><textPath href="#cp-p' + i + '" id="cp-tp' + i + '"></textPath></text>';
          }) +
        '</svg>' +
        '<div class="cp-contact"><span>alex@pleko.es</span><span>BCN</span><span>656 310 631</span></div>' +
      '</div>' +
      '<div class="cp-face cp-front"><img src="/pleko-logo.svg?v=2" alt="" width="314" height="116"><span class="cp-tag">' + T.tag + '</span></div>' +
    '</div></div>' +
    '<button type="button" class="cp-replay">' + T.replay + '</button></div>' +
    '<div class="cp-rest"><p class="cp-lang"><a href="' + T.otherHref + '" hreflang="' + (lang === 'es' ? 'en' : 'es') + '" lang="' + (lang === 'es' ? 'en' : 'es') + '">' + T.other + '</a></p></div>' +
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
  requestAnimationFrame(function () { overlay.classList.add('is-on'); dlg.focus({ preventScroll: true }); });

  // ---------- animation ----------
  var ease = function (x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  var clamp = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var ref = $('cp-ref');
  var halves = null, S = 1, raf = 0, t0 = 0, curT = 0;
  var START = [1000, 1450, 1900], DUR = 1500, TEND = START[NP - 1] + DUR;
  var C0 = [0, 101, 101], C1 = [27, 28, 28];   // teal on the card -> near-black headline

  function build() {
    var ws = [], total = 0, i;
    for (i = 0; i < NP; i++) {
      var m = $('cp-m' + i); m.setAttribute('font-size', BASE); m.textContent = T.parts[i];
      ws.push(m.getComputedTextLength()); total += ws[i];
      $('cp-tp' + i).textContent = T.parts[i];
    }
    var L = ref.getTotalLength(), s0 = 0;
    halves = [];
    for (i = 0; i < NP; i++) {
      var len = L * ws[i] / total;
      halves.push(mk(s0, len, ws[i], i)); s0 += len;
    }
    layout();
  }
  function mk(s0, len, w, idx) {
    var pts = [], i, Lr = ref.getTotalLength();
    for (i = 0; i <= N; i++) pts.push(ref.getPointAtLength(Math.min(s0 + len * i / N, Lr)));
    var ch = [], th = [], prev = null;
    for (i = 0; i < N; i++) {
      var dx = pts[i + 1].x - pts[i].x, dy = pts[i + 1].y - pts[i].y;
      var a = Math.atan2(dy, dx);
      if (prev !== null) { while (a - prev > Math.PI) a -= 2 * Math.PI; while (a - prev < -Math.PI) a += 2 * Math.PI; }
      else { while (a > 0) a -= 2 * Math.PI; while (a <= -2 * Math.PI) a += 2 * Math.PI; }
      th.push(a); prev = a; ch.push(Math.sqrt(dx * dx + dy * dy));
    }
    return { len: len, w: w, p0: pts[0], ch: ch, th: th, path: $('cp-p' + idx), text: $('cp-t' + idx), n: T.parts[idx].length, ax: 0, ay: 0, fl: 0, idx: idx };
  }
  function layout() {
    if (!halves) return;
    var k = (card.offsetWidth * 40 / 61) / 400 || 1;           // pixels per drawing unit
    var F = parseFloat(window.getComputedStyle(scene).fontSize) || 22;   // final text size in px
    S = F / (BASE * k);
    var cardTop = -255;                                          // card's upper edge, in ring units (the card is taller than the ring)
    halves.forEach(function (h, i) {
      h.ax = 200 - h.w * S / 2; h.ay = cardTop - (F / k) * (0.55 + 1.3 * (NP - 1 - i)); h.fl = h.w * S / N;
    });
    scene.style.paddingTop = Math.ceil(F * (0.55 + 1.3 * (NP - 1) + 1.05)) + 'px';
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
    h.path.setAttribute('d', d);
    h.text.setAttribute('font-size', fs.toFixed(2));
    h.text.setAttribute('letter-spacing', ((total - h.w * fs / BASE) / h.n).toFixed(3));
    h.text.style.fill = 'rgb(' + [0, 1, 2].map(function (c) { return Math.round(lerp(C0[c], C1[c], g)); }).join(',') + ')';
  }
  function render(t) {
    curT = t;
    var a = ease(clamp(t / 2200)), bump = Math.sin(Math.PI * clamp(t / 2200));
    card.style.transform = 'rotateY(' + (a * 360).toFixed(2) + 'deg) scale(' + (1 + 0.06 * bump).toFixed(3) + ')';
    for (var i = 0; i < NP; i++) drawHalf(halves[i], clamp((t - START[i]) / DUR));
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

  var fontsReady = (document.fonts && document.fonts.load) ? document.fonts.load('500 30px Inter').catch(function () {}) : Promise.resolve();
  fontsReady.then(function () { build(); play(); });
})();
