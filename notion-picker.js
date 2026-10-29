/* "Arma tu Notion" / "Build your Notion": the tool buttons on the Notion page
   choose which threads are drawn from your tools, through a connector, to Notion.
   Plain JS, no libraries. Text comes from the buttons' data attributes, so the
   same file serves the Spanish and English pages. */
(function () {
  'use strict';

  var root = document.querySelector('[data-picker]');
  if (!root) return;

  var NS = 'http://www.w3.org/2000/svg';
  var svg = root.querySelector('.picker__svg');
  var list = root.querySelector('[data-picker-list]');
  var note = root.querySelector('[data-picker-note]');
  var chips = Array.prototype.slice.call(root.querySelectorAll('.picker__chip'));
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var connLabel = svg.getAttribute('data-conn');
  var notionLabel = svg.getAttribute('data-notion');
  var notionSub = svg.getAttribute('data-notion-sub');

  // Two layouts: wide for tablets and desktops, narrow for phones.
  var LAYOUTS = {
    wide:   { w: 640, h: 390, tw: 180, th: 38, gap: 15, tx: 8,   knot: [380, 195], nx: 478, ny: 130, nw: 154, nh: 130, font: 15 },
    narrow: { w: 320, h: 350, tw: 126, th: 36, gap: 14, tx: 2,   knot: [196, 175], nx: 228, ny: 125, nw: 90,  nh: 100, font: 14 }
  };
  var layoutName = null;

  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) if (attrs.hasOwnProperty(k)) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function selected() {
    return chips.filter(function (c) { return c.getAttribute('aria-pressed') === 'true'; });
  }

  function draw() {
    var name = root.clientWidth < 560 ? 'narrow' : 'wide';
    var L = LAYOUTS[name];
    layoutName = name;
    svg.setAttribute('viewBox', '0 0 ' + L.w + ' ' + L.h);
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    var kx = L.knot[0], ky = L.knot[1];
    var nCx = L.nx + L.nw / 2, nCy = L.ny + L.nh / 2;
    var on = selected();
    var onKeys = on.map(function (c) { return c.getAttribute('data-tool'); });

    // threads first, so the boxes sit on top of them
    var threads = el('g', { 'class': 'picker__threads' }, svg);
    chips.forEach(function (c, i) {
      var key = c.getAttribute('data-tool');
      if (onKeys.indexOf(key) < 0) return;
      var y = 10 + i * (L.th + L.gap) + L.th / 2;
      var x0 = L.tx + L.tw;
      var d = 'M' + x0 + ',' + y + ' C' + (x0 + (kx - x0) * 0.55) + ',' + y + ' ' + (x0 + (kx - x0) * 0.45) + ',' + ky + ' ' + (kx - 14) + ',' + ky;
      var p = el('path', { d: d, 'class': 'picker__thread', id: 'th-' + key }, threads);
      if (!reduce) {
        var dot = el('circle', { r: 4, 'class': 'picker__dot' }, threads);
        var am = el('animateMotion', { dur: (2.4 + (i % 3) * 0.3) + 's', repeatCount: 'indefinite', begin: (i * 0.25) + 's' }, dot);
        el('mpath', { href: '#th-' + key }, am);
      }
    });
    if (on.length) {
      var outD = 'M' + (kx + 14) + ',' + ky + ' L' + L.nx + ',' + nCy;
      var out = el('path', { d: outD, 'class': 'picker__thread picker__thread--out', id: 'th-out' }, threads);
      if (!reduce) {
        var od = el('circle', { r: 4, 'class': 'picker__dot' }, threads);
        var oam = el('animateMotion', { dur: '1.6s', repeatCount: 'indefinite' }, od);
        el('mpath', { href: '#th-out' }, oam);
      }
    }

    // tool boxes
    chips.forEach(function (c, i) {
      var key = c.getAttribute('data-tool');
      var isOn = onKeys.indexOf(key) >= 0;
      var y = 10 + i * (L.th + L.gap);
      var g = el('g', { 'class': 'picker__tool' + (isOn ? ' is-on' : '') }, svg);
      el('rect', { x: L.tx, y: y, width: L.tw, height: L.th, rx: 10 }, g);
      var t = el('text', { x: L.tx + L.tw / 2, y: y + L.th / 2 + L.font * 0.35, 'text-anchor': 'middle', 'font-size': L.font }, g);
      t.textContent = c.textContent;
    });

    // connector knot: a small ring with the pleko orange dot
    var k = el('g', { 'class': 'picker__knot' + (on.length ? ' is-on' : '') }, svg);
    el('circle', { cx: kx, cy: ky, r: 14 }, k);
    el('circle', { cx: kx + 9, cy: ky - 9, r: 3.5, 'class': 'picker__orange' }, k);
    var kl = el('text', { x: kx, y: ky + 34, 'text-anchor': 'middle', 'font-size': L.font - 2, 'class': 'picker__label' }, k);
    kl.textContent = connLabel;

    // Notion box (a generic page, not Notion's logo)
    var n = el('g', { 'class': 'picker__notion' + (on.length ? ' is-on' : '') }, svg);
    el('rect', { x: L.nx, y: L.ny, width: L.nw, height: L.nh, rx: 14 }, n);
    var ix = L.nx + L.nw / 2 - 11, iy = L.ny + 16;
    el('rect', { x: ix, y: iy, width: 22, height: 28, rx: 3, 'class': 'picker__page' }, n);
    el('path', { d: 'M' + (ix + 5) + ',' + (iy + 10) + ' h12 M' + (ix + 5) + ',' + (iy + 16) + ' h12 M' + (ix + 5) + ',' + (iy + 22) + ' h7', 'class': 'picker__lines' }, n);
    var nt = el('text', { x: nCx, y: L.ny + L.nh - 36, 'text-anchor': 'middle', 'font-size': L.font + 3, 'class': 'picker__notion-name' }, n);
    nt.textContent = notionLabel;
    var ns = el('text', { x: nCx, y: L.ny + L.nh - 14, 'text-anchor': 'middle', 'font-size': L.font - 3, 'class': 'picker__label' }, n);
    ns.textContent = notionSub;
  }

  function writeText() {
    var on = selected();
    list.innerHTML = '';
    if (!on.length) {
      var li = document.createElement('li');
      li.className = 'picker__empty';
      li.textContent = list.getAttribute('data-empty');
      list.appendChild(li);
    }
    var notes = [];
    on.forEach(function (c) {
      var li2 = document.createElement('li');
      var b = document.createElement('strong');
      b.textContent = c.textContent + '. ';
      li2.appendChild(b);
      li2.appendChild(document.createTextNode(c.getAttribute('data-text')));
      list.appendChild(li2);
      var nt = c.getAttribute('data-note');
      if (nt) notes.push(nt);
    });
    note.textContent = notes.join(' ');
    note.hidden = !notes.length;
  }

  function update() { draw(); writeText(); }

  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      var now = c.getAttribute('aria-pressed') === 'true';
      c.setAttribute('aria-pressed', now ? 'false' : 'true');
      update();
    });
  });

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var name = root.clientWidth < 560 ? 'narrow' : 'wide';
      if (name !== layoutName) draw();
    }, 120);
  });

  update();
})();
