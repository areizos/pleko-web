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

  var UTM = '?utm_source=business_card&utm_medium=print&utm_campaign=networking';
  var lang = (document.documentElement.lang || 'es').slice(0, 2) === 'en' ? 'en' : 'es';
  var T = {
    es: {
      h: 'Sí, las tarjetas de papel siguen funcionando. Acabas de demostrarlo.',
      wide: ['Sí, las tarjetas de papel siguen funcionando.', 'Acabas de demostrarlo.'],
      narrow: ['Sí, las tarjetas de papel', 'siguen funcionando.', 'Acabas de demostrarlo.'],
      tag: 'Automatización e IA', replay: 'Ver otra vez', close: 'Cerrar',
      other: 'EN', otherHref: '/en/' + UTM, otherLabel: 'English',
      aria: 'Tarjeta de visita de pleko, parte de atrás'
    },
    en: {
      h: 'Yes, paper business cards still work. You\u2019ve just proved it.',
      wide: ['Yes, paper business cards still work.', 'You\u2019ve just proved it.'],
      narrow: ['Yes, paper business cards', 'still work.', 'You\u2019ve just proved it.'],
      tag: 'Automation and AI', replay: 'Watch again', close: 'Close',
      other: 'ES', otherHref: '/' + UTM, otherLabel: 'Español',
      aria: 'pleko business card, back'
    }
  }[lang];

  var RING = 'M90,360 L310,360 A50,50 0 0 0 360,310 L360,90 A50,50 0 0 0 310,40 L90,40 A50,50 0 0 0 40,90 L40,310 A50,50 0 0 0 90,360 Z';
  var BASE = 30, N = 90, NP = 3;   // NP is set again once the layout (2 or 3 lines) is chosen
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function parts(f) { var s = '', i; for (i = 0; i < NP; i++) s += f(i); return s; }
  var html =
    '<div class="cp-overlay" role="dialog" aria-modal="true" aria-labelledby="cp-h">' +
    '<div class="cp-dialog">' +
    '<button type="button" class="cp-x" aria-label="' + T.close + '">&times;</button>' +
    '<div class="cp-head">' +
    '<h2 class="sr-only" id="cp-h">' + T.h + '</h2>' +
    '</div>' +
    '<div class="cp-visual"><div class="cp-scene"><div class="cp-stage">' +
    '<div class="cp-card" role="img" aria-label="' + T.aria + '">' +
      '<div class="cp-face cp-back">' +
        '<div class="cp-name">Alexandros Re<span class="cp-i">ï</span>zos</div>' +
        '<img class="cp-qr" src="/card-popup/qr.svg?v=2" alt="" width="290" height="290">' +
        '<div class="cp-contact"><span>alex@pleko.es</span><span>BCN</span><span>656 310 631</span></div>' +
      '</div>' +
      '<div class="cp-face cp-front"><img src="/pleko-logo.svg?v=2" alt="" width="314" height="116"><span class="cp-tag">' + T.tag + '</span></div>' +
    '</div>' +
    '<svg class="cp-ring cp-over" viewBox="0 0 400 400" aria-hidden="true" focusable="false"></svg>' +
    '</div></div>' +
    '<div class="cp-tools"><a class="cp-lang" href="' + T.otherHref + '" hreflang="' + (lang === 'es' ? 'en' : 'es') + '" lang="' + (lang === 'es' ? 'en' : 'es') + '" aria-label="' + T.otherLabel + '">' + T.other + '</a>' +
      '<button type="button" class="cp-replay" aria-label="' + T.replay + '" title="' + T.replay + '">' +
      '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M20 12a8 8 0 1 1-2.6-5.9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M20 4v5h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div></div>' +
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
  var over = overlay.querySelector('.cp-over');
  var $ = function (id) { return document.getElementById(id); };

  // ---------- close ----------
  function close() {
    cancelAnimationFrame(raf); clearTimeout(autoTimer);
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
  // The text lives on its own layer over the card and turns with it. Before the turn has
  // finished the text starts to unwind into straight lines; the card moves back and fades
  // away; at the end only the lines are left, in the middle.
  var ease = function (x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  var clamp = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var NS = 'http://www.w3.org/2000/svg';
  var ref = null, lines = null, S = 1, raf = 0, t0 = 0, curT = 0, mode = '';
  var SPIN = 1500, FADE = 1000, FADE0 = 1300, START = [1000, 1300, 1600], DUR = 1100, TEND = 2500;
  var $s = function (tag, attrs) { var n = document.createElementNS(NS, tag), k; for (k in attrs) n.setAttribute(k, attrs[k]); return n; };

  function measure(str) {
    var m = $s('text', { 'font-size': BASE, style: 'visibility:hidden' });
    m.textContent = str; over.appendChild(m);
    var w = m.getComputedTextLength(); over.removeChild(m); return w;
  }
  function build() {
    over.innerHTML = '';
    ref = $s('path', { d: RING, fill: 'none' }); over.appendChild(ref);
    // two lines when they fit comfortably, three on narrow screens
    var sceneW = scene.clientWidth || 300;
    var wideW = Math.max(measure(T.wide[0]), measure(T.wide[1]));
    var fitF = 0.94 * sceneW / (wideW / BASE);
    var txt = fitF >= 21 ? T.wide : T.narrow;
    NP = txt.length;
    TEND = Math.max(FADE0 + FADE, START[NP - 1] + DUR) + 100;
    var ws = txt.map(measure), total = ws.reduce(function (x, y) { return x + y; }, 0);
    var L = ref.getTotalLength(), s0 = 0;
    lines = txt.map(function (str, i) {
      var len = L * ws[i] / total;
      var path = $s('path', { id: 'cp-p' + i, fill: 'none' });
      var tp = $s('textPath', { href: '#cp-p' + i }); tp.textContent = str;
      var te = $s('text'); te.appendChild(tp);
      over.appendChild(path); over.appendChild(te);
      var h = mk(s0, len, ws[i], i, str.length);
      h.path = path; h.text = te; s0 += len;
      return h;
    });
    layout();
    render(0);
  }
  function mk(s0, len, w, idx, n) {
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
    return { len: len, w: w, p0: pts[0], ch: ch, th: th, n: n, ax: 0, ay: 0, fl: 0, idx: idx };
  }
  function layout() {
    if (!lines) return;
    var k = (card.offsetWidth * 40 / 61) / 400 || 1;            // pixels per drawing unit
    var F = parseFloat(window.getComputedStyle(scene).fontSize) || 24;   // largest text size in px
    var maxW = Math.max.apply(null, lines.map(function (h) { return h.w; }));
    S = Math.min(F / (BASE * k), 0.94 * (scene.clientWidth || 300) / (maxW * k));
    var Fpx = BASE * k * S;                                       // actual size of the final lines
    // one blank line between the two sentences: the second sentence is the last line
    var off = [], pos = 0;
    lines.forEach(function (h, i) { if (i > 0) pos += (i === NP - 1 ? 2.6 : 1.3); off.push(pos); });
    var mid = pos / 2;
    lines.forEach(function (h, i) {
      h.ax = 200 - h.w * S / 2;                                   // centred on the card
      h.ay = 200 + (Fpx / k) * (0.32 + off[i] - mid);             // baselines around the card's middle
      h.fl = h.w * S / N;
    });
  }
  function drawLine(h, r) {
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
  }
  function render(t) {
    curT = t;
    var a = ease(clamp(t / SPIN)), bump = Math.sin(Math.PI * clamp(t / SPIN));
    var f = ease(clamp((t - FADE0) / FADE));                      // card moves back and fades
    var turn = 'rotateY(' + (a * 360).toFixed(2) + 'deg)', pop = ' scale(' + (1 + 0.06 * bump).toFixed(3) + ')';
    card.style.transform = turn + ' translateZ(' + (-f * 420).toFixed(1) + 'px)' + pop;
    card.style.opacity = (1 - f).toFixed(3);
    over.style.transform = turn + pop;                            // the text layer turns with the card
    for (var i = 0; i < NP; i++) drawLine(lines[i], clamp((t - START[i]) / DUR));
  }
  // The pop-up leaves by itself AUTO_MS after the text has finished, unless the visitor
  // points at it, touches it or tabs into it.
  var AUTO_MS = 5000, autoTimer = 0, engaged = false;
  function arm() { clearTimeout(autoTimer); if (!engaged) autoTimer = setTimeout(close, AUTO_MS); }
  ['mouseenter', 'touchstart', 'keydown', 'pointerdown'].forEach(function (ev) {
    dlg.addEventListener(ev, function () { engaged = true; clearTimeout(autoTimer); }, { passive: true });
  });
  function frame(now) {
    var t = now - t0;
    render(Math.min(t, TEND));
    if (t < TEND) raf = requestAnimationFrame(frame); else arm();
  }
  function play() {
    cancelAnimationFrame(raf);
    if (reduce) { render(TEND); arm(); return; }
    render(0);
    t0 = performance.now() + 350;
    raf = requestAnimationFrame(function tick(now) { if (now < t0) { raf = requestAnimationFrame(tick); return; } frame(now); });
  }
  overlay.querySelector('.cp-replay').addEventListener('click', play);
  window.addEventListener('resize', function () { layout(); if (halves) render(curT); });
  window.__cpSeek = function (t) { cancelAnimationFrame(raf); render(t); };   // used by tests only

  var fontsReady = (document.fonts && document.fonts.load) ? document.fonts.load('600 30px Literata').catch(function () {}) : Promise.resolve();
  fontsReady.then(function () { build(); play(); });
})();
