/* =========================================================================
   pleko.es: "ovillo" heading. A line of text starts rolled up like a ball
   of yarn and unrolls into a readable line, once, when it scrolls into view.
   ---------------------------------------------------------------------
   Markup (the plain text is the fallback and what screen readers read):
     <h1 class="pk-yarn">
       <span class="pk-yarn__line">Automatización</span>
       <span class="pk-yarn__line" data-dir="left">e IA en <span>Barcelona</span>.</span>
     </h1>
   Each line is its own ball. data-dir="left" makes that ball roll from the
   right-hand end towards the left; the default rolls left to right.
   The ball sits on top of its line; data-ball="below" hangs it underneath.
   No libraries. Plays once, never loops. With "reduce motion" switched on
   (or no JavaScript) the finished text is simply shown.
   ========================================================================= */
(function () {
  'use strict';
  var els = document.querySelectorAll('.pk-yarn');
  if (!els.length || !window.requestAnimationFrame || !document.createElementNS) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  var NS = 'http://www.w3.org/2000/svg', N = 120, uid = 0;
  var ease = function (x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  var clamp = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
  var $s = function (tag, attrs) { var n = document.createElementNS(NS, tag), k; for (k in attrs) n.setAttribute(k, attrs[k]); return n; };

  // The shape of the ball: a thread wound round a sphere, each loop at a new tilt
  // (seen from the front, like a drawing of a ball of yarn). Returned as the turn
  // the thread makes at each of N equal steps, so it can be unrolled step by step.
  function windings(seed, dir0, down) {
    var M = 900, P = [], i, lenAcc = [0];
    for (i = 0; i <= M; i++) {
      var s = i / M, th = 2 * Math.PI * TURNS * s;
      var ph = seed + 2.3 * Math.PI * s, ps = 0.5 + 0.9 * Math.sin(2.7 * s * Math.PI + seed);
      var x = Math.cos(th), y = Math.sin(th);
      var x1 = x * Math.cos(ph), z1 = -x * Math.sin(ph);
      var y2 = y * Math.cos(ps) - z1 * Math.sin(ps);
      var rr = 1 - 0.25 * s;                       // a little tighter towards the core
      P.push([x1 * rr, y2 * rr]);
      if (i) { var dx = P[i][0] - P[i - 1][0], dy = P[i][1] - P[i - 1][1]; lenAcc.push(lenAcc[i - 1] + Math.sqrt(dx * dx + dy * dy)); }
    }
    var tot = lenAcc[M], Q = [], j = 0;
    for (i = 0; i <= N; i++) {                      // equal steps along the thread
      var want = tot * i / N;
      while (j < M - 1 && lenAcc[j + 1] < want) j++;
      var f = (want - lenAcc[j]) / ((lenAcc[j + 1] - lenAcc[j]) || 1);
      Q.push([P[j][0] + (P[j + 1][0] - P[j][0]) * f, P[j][1] + (P[j + 1][1] - P[j][1]) * f]);
    }
    var k = [0], prev = Math.atan2(Q[1][1] - Q[0][1], Q[1][0] - Q[0][0]);
    for (i = 1; i < N; i++) {
      var a = Math.atan2(Q[i + 1][1] - Q[i][1], Q[i + 1][0] - Q[i][0]), d = a - prev;
      while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      k.push(d); prev = a;
    }
    // make the ball sit above the line, not hang below it
    var dir = dir0, yy = 0, sum = 0;
    for (i = 0; i < N; i++) { dir += k[i]; yy += Math.sin(dir); sum += yy; }
    if (sum > 0 !== !!down) k = k.map(function (v) { return -v; });
    return k;
  }

  // timing in ms, from the moment the heading is on screen
  var APPEAR = 350, DUR = 1500, GAP = 550, SPREAD = 2.6, SHRINK = 0.5, TURNS = 1.5;

  function setup(el) {
    var spans = [].slice.call(el.querySelectorAll('.pk-yarn__line'));
    if (!spans.length) return;
    var svg = $s('svg', { class: 'pk-yarn__svg', 'aria-hidden': 'true', focusable: 'false' });
    el.appendChild(svg);
    var cs = window.getComputedStyle(spans[0]);
    var F = parseFloat(cs.fontSize) || 32;
    svg.style.fontFamily = cs.fontFamily; svg.style.fontWeight = cs.fontWeight; svg.style.fontStyle = cs.fontStyle;

    // baseline offset: where the text's baseline sits inside its line box
    var probe = $s('text', { 'font-size': F, x: 0, y: 0 }); probe.textContent = 'Hg';
    svg.appendChild(probe);
    var bb = probe.getBBox(); svg.removeChild(probe);

    var box = el.getBoundingClientRect();
    var ls = (parseFloat(cs.letterSpacing) || 0) / F;            // letter spacing, in em
    // copy a line's words into SVG, keeping coloured or italic words (like "Barcelona") as they are
    function fill(node, sp) {
      [].forEach.call(sp.childNodes, function (c) {
        if (c.nodeType === 3) { node.appendChild(document.createTextNode(c.textContent)); return; }
        if (c.nodeType !== 1) return;
        var k = window.getComputedStyle(c);
        var t = $s('tspan', { fill: k.color }); t.style.fontStyle = k.fontStyle; t.style.fontWeight = k.fontWeight;
        t.textContent = c.textContent; node.appendChild(t);
      });
    }
    var lines = spans.map(function (sp, idx) {
      var r = sp.getBoundingClientRect();
      var id = 'pk-yarn-' + (++uid);
      var path = $s('path', { id: id, fill: 'none' });
      var tp = $s('textPath', { href: '#' + id }); fill(tp, sp);
      var te = $s('text', { 'font-size': F }); te.style.letterSpacing = ls + 'em'; te.appendChild(tp);
      svg.appendChild(path); svg.appendChild(te);
      var m = $s('text', { 'font-size': F }); m.style.letterSpacing = ls + 'em'; fill(m, sp); svg.appendChild(m);
      var w = m.getComputedTextLength(); svg.removeChild(m);
      var left = sp.getAttribute('data-dir') === 'left', down = sp.getAttribute('data-ball') === 'below';
      var base = r.top - box.top + (r.height - bb.height) / 2 - bb.y;
      return {
        path: path, text: te, w: w, left: left, down: down,
        kap: windings(1.3 + idx * 2.1, left ? Math.PI : 0, down),
        ax: left ? r.right - box.left : r.left - box.left, ay: base,
        start: APPEAR + idx * GAP
      };
    });
    el.classList.add('is-yarn');
    return { el: el, svg: svg, lines: lines, F: F, total: APPEAR + (lines.length - 1) * GAP + DUR };
  }

  function draw(L, F, r) {
    var g = ease(clamp(r));
    var fs = F * (SHRINK + (1 - SHRINK) * g);
    var step = L.w * (fs / F) / N;
    var dir = L.left ? Math.PI : 0, x = L.ax, y = L.ay, pts = [x, y], piv = -1, i;
    for (i = 0; i < N; i++) {
      var u = ease(clamp(r * (1 + SPREAD) - SPREAD * i / (N - 1)));
      if (piv < 0 && u < 0.999) piv = i;
      dir += L.kap[i] * (1 - u);                // the unrolled part lies flat, the rest stays wound
      x += step * Math.cos(dir); y += step * Math.sin(dir);
      pts.push(x, y);
    }
    // keep what is still wound sitting on top of the line, like a ball resting on it
    if (piv >= 0 && piv < N - 2) {
      var px = pts[2 * piv], py = pts[2 * piv + 1], cx = 0, cy = 0, c = 0;
      for (i = piv + 1; i <= N; i++) { cx += pts[2 * i]; cy += pts[2 * i + 1]; c++; }
      cx = cx / c - px; cy = cy / c - py;
      var beta = (L.down ? Math.PI / 2 : -Math.PI / 2) - Math.atan2(cy, cx);
      while (beta > Math.PI) beta -= 2 * Math.PI; while (beta < -Math.PI) beta += 2 * Math.PI;
      beta *= Math.min(1, (N - piv) / 12);
      for (i = piv + 1; i <= N; i++) {
        var w = beta * Math.min(1, (i - piv) / 10), cs = Math.cos(w), sn = Math.sin(w);
        var qx = pts[2 * i] - px, qy = pts[2 * i + 1] - py;
        pts[2 * i] = px + qx * cs - qy * sn; pts[2 * i + 1] = py + qx * sn + qy * cs;
      }
    }
    var d = '', n = pts.length / 2, j;
    for (j = 0; j < n; j++) {
      var k = L.left ? n - 1 - j : j;          // text always runs from its first letter
      d += (j ? 'L' : 'M') + pts[2 * k].toFixed(2) + ',' + pts[2 * k + 1].toFixed(2);
    }
    L.path.setAttribute('d', d);
    L.text.setAttribute('font-size', fs.toFixed(2));
  }

  function play(st) {
    if (st.raf) cancelAnimationFrame(st.raf);
    st.el.classList.remove('is-done');
    st.el.classList.add('is-yarn');
    var t0 = 0;
    function frame(now) {
      if (!t0) t0 = now;
      var t = now - t0;
      st.svg.style.opacity = clamp(t / APPEAR).toFixed(3);
      st.lines.forEach(function (L) { draw(L, st.F, (t - L.start) / DUR); });
      if (t < st.total) st.raf = requestAnimationFrame(frame);
      else finish(st);
    }
    st.lines.forEach(function (L) { draw(L, st.F, 0); });
    st.svg.style.opacity = '0';
    st.raf = requestAnimationFrame(frame);
  }
  function finish(st) {
    if (st.raf) cancelAnimationFrame(st.raf);
    st.raf = 0;
    st.el.classList.add('is-done');          // the real text takes over: crisp and selectable
    st.el.classList.remove('is-yarn');
  }

  var fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
  fontsReady.then(function () {
    [].forEach.call(els, function (el) {
      var st = null;
      function start() {
        if (st) { st.svg.parentNode.removeChild(st.svg); }
        st = setup(el); if (!st) return;
        play(st);
      }
      el.__yarnReplay = start;
      el.__yarnSeek = function (t) {           // tests only: freeze the animation at t ms
        if (!st) { st = setup(el); }
        if (st.raf) cancelAnimationFrame(st.raf); st.raf = 0;
        el.classList.remove('is-done', 'is-waiting'); el.classList.add('is-yarn');
        st.svg.style.opacity = clamp(t / APPEAR).toFixed(3);
        st.lines.forEach(function (L) { draw(L, st.F, (t - L.start) / DUR); });
      };               // used by the preview page's "Ver otra vez" button
      window.addEventListener('resize', function () { if (st && st.raf) finish(st); });
      if (!('IntersectionObserver' in window)) return;   // no observer: the plain text stays
      el.classList.add('is-waiting');
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          io.disconnect();
          el.classList.remove('is-waiting');
          start();
        });
      }, { threshold: 0.6 });
      io.observe(el);
    });
  });
})();
