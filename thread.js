/* pleko "thread": one teal line with square bends runs down the left of the page, draws itself as you scroll,
   and lands on an orange node at each section (a small pop, a soft ring and a brief orange glow on the leg that
   just arrived). Decorative only: aria-hidden, no clicks, and it is simply drawn in full for reduced-motion users.
   Needs <main id="top">. Sections without an h2 (and hero sections) get no node. */
(function () {
  var main = document.getElementById('top');
  if (!main || !document.createElementNS) return;
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var css = document.createElement('style');
  css.textContent =
    '.pk-thread{position:absolute;left:0;top:0;pointer-events:none;z-index:2;overflow:visible}' +
    '.pk-thread path{fill:none;stroke-linecap:round;stroke-linejoin:round}' +
    '.pk-thread .line{stroke:var(--color-primary,#006565);stroke-width:2.5}' +
    '.pk-thread .leg{stroke:#cc5500;stroke-width:3;opacity:0}' +
    '.pk-thread .node{fill:#cc5500;stroke:var(--color-background,#fcf9f8);stroke-width:3;opacity:0;transform-box:fill-box;transform-origin:center}' +
    '.pk-thread .ring{fill:none;stroke:#cc5500;stroke-width:2;opacity:0;transform-box:fill-box;transform-origin:center}' +
    '.pk-thread .on.node{opacity:1;animation:pk-pop .5s cubic-bezier(.2,.8,.3,1.3)}' +
    '.pk-thread .on.ring{animation:pk-ring .9s ease-out}' +
    '.pk-thread .on.leg{animation:pk-glow 1.5s ease-out}' +
    '@keyframes pk-pop{0%{transform:scale(.3);opacity:0}100%{transform:scale(1);opacity:1}}' +
    '@keyframes pk-ring{0%{transform:scale(1);opacity:.55}100%{transform:scale(3);opacity:0}}' +
    '@keyframes pk-glow{0%{opacity:.95}100%{opacity:0}}' +
    '@media (prefers-reduced-motion:reduce){.pk-thread .on.node{animation:none}.pk-thread .on.ring,.pk-thread .on.leg{animation:none;opacity:0}}';
  document.head.appendChild(css);

  var svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'pk-thread');
  svg.setAttribute('aria-hidden', 'true');
  if (getComputedStyle(main).position === 'static') main.style.position = 'relative';
  main.appendChild(svg);

  var line, len = 0, y0 = 0, y1 = 1, marks = [];
  function el(n, a) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); svg.appendChild(e); return e; }

  function build() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    marks = [];
    var mr = main.getBoundingClientRect(), top = window.scrollY + mr.top;
    var W = main.clientWidth, H = main.scrollHeight;
    svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var h1 = main.querySelector('h1');
    if (!h1) return;
    var x = Math.max(9, h1.getBoundingClientRect().left - mr.left - 24);
    var stops = [];
    [].slice.call(main.children).forEach(function (sec) {
      if (sec.tagName !== 'SECTION' || sec.classList.contains('hero') || sec.classList.contains('subpage-hero')) return;
      if (sec.offsetHeight === 0) return;
      if (sec.classList.contains('contact')) { stops.push({ y: window.scrollY + sec.getBoundingClientRect().top - top + 2 }); return; }
      var h = sec.querySelector('h2');
      if (h) stops.push({ y: window.scrollY + h.getBoundingClientRect().top - top + 14 });
    });
    if (!stops.length) return;
    y0 = 40; y1 = stops[stops.length - 1].y;
    var d = 'M' + x + ' ' + y0, px = x, py = y0, legs = [];
    stops.forEach(function (p, i) {
      var tx = (i % 2) ? x : x + 9;
      var mid = Math.round((py + p.y) / 2);
      var seg = ' V' + mid + ' H' + tx + ' V' + p.y;
      d += seg;
      legs.push('M' + px + ' ' + py + seg);
      marks.push({ x: tx, y: p.y });
      px = tx; py = p.y;
    });
    line = el('path', { 'class': 'line', d: d });
    len = line.getTotalLength();
    line.style.strokeDasharray = len;
    marks.forEach(function (m, i) {
      m.leg = el('path', { 'class': 'leg', d: legs[i] });
      m.ring = el('circle', { 'class': 'ring', cx: m.x, cy: m.y, r: 6 });
      m.node = el('circle', { 'class': 'node', cx: m.x, cy: m.y, r: 6.5 });
    });
    update();
  }

  function update() {
    if (!line) return;
    var top = window.scrollY + main.getBoundingClientRect().top;
    var drawn = reduce ? y1 + 1 : (window.scrollY + window.innerHeight * 0.65 - top);
    var p = Math.max(0, Math.min(1, (drawn - y0) / (y1 - y0)));
    line.style.strokeDashoffset = len * (1 - p);
    marks.forEach(function (m) {
      var on = drawn >= m.y;
      [m.leg, m.ring, m.node].forEach(function (e) {
        if (on) { if (!e.classList.contains('on')) e.classList.add('on'); }
        else e.classList.remove('on');
      });
    });
  }

  var t;
  function later() { clearTimeout(t); t = setTimeout(build, 150); }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', later);
  window.addEventListener('load', later);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(later);
  if (window.ResizeObserver) new ResizeObserver(later).observe(main);
  build();
})();
