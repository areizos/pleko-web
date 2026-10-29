/* "Arma tu Notion" / "Build your Notion": the tool buttons on the Notion page
   draw threads from your tools, through a connector, to Notion, and fill in an
   example client record (made-up data) block by block. "Mark as won" shows what
   happens next. The contact buttons at the end quote what was ticked.
   Plain JS, no libraries. All text lives in the page's HTML (data attributes and
   hidden blocks), so the same file serves the Spanish and English pages. */
(function () {
  'use strict';

  var root = document.querySelector('[data-picker]');
  if (!root) return;

  var NS = 'http://www.w3.org/2000/svg';
  var svg = root.querySelector('.picker__svg');
  var stage = root.querySelector('.picker__stage');
  var note = root.querySelector('[data-picker-note]');
  var blocks = Array.prototype.slice.call(root.querySelectorAll('.ncard__block'));
  var emptyMsg = root.querySelector('[data-ncard-empty]');
  var pill = root.querySelector('[data-pill]');
  var origin = root.querySelector('[data-origin]');
  var wonBlock = root.querySelector('[data-won-block]');
  var winBtn = root.querySelector('[data-win]');
  var cta = root.querySelector('[data-cta]');
  var ctaText = root.querySelector('[data-cta-text]');
  var ctaWa = root.querySelector('[data-cta-wa]');
  var ctaMail = root.querySelector('[data-cta-mail]');
  var won = false;
  var firstRun = true;
  var chips = Array.prototype.slice.call(root.querySelectorAll('.picker__chip'));
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var connLabel = svg.getAttribute('data-conn');
  var notionLabel = svg.getAttribute('data-notion');
  var notionSub = svg.getAttribute('data-notion-sub');

  // Two layouts: wide for tablets and desktops, narrow for phones.
  var LAYOUTS = {
    wide:   { w: 640, h: 390, tw: 180, th: 38, gap: 15, tx: 8,   knot: [380, 195], nx: 478, ny: 130, nw: 154, nh: 130, font: 15 },
    narrow: { w: 320, h: 350, tw: 126, th: 36, gap: 14, tx: 2,   knot: [188, 175], nx: 214, ny: 125, nw: 104, nh: 100, font: 14 }
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
    var name = stage.clientWidth < 440 ? 'narrow' : 'wide';
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
    var ns = el('text', { x: nCx, y: L.ny + L.nh - 14, 'text-anchor': 'middle', 'font-size': L.font - (name === 'narrow' ? 4 : 3), 'class': 'picker__label' }, n);
    ns.textContent = notionSub;
  }

  function joinList(items, and) {
    if (items.length < 2) return items.join('');
    return items.slice(0, -1).join(', ') + ' ' + and + ' ' + items[items.length - 1];
  }

  function writeCard() {
    var on = selected();
    var keys = on.map(function (c) { return c.getAttribute('data-tool'); });

    blocks.forEach(function (b) {
      var show = keys.indexOf(b.getAttribute('data-block')) >= 0;
      if (show && b.hidden) {
        b.hidden = false;
        if (firstRun || reduce) {
          b.classList.add('is-in');
        } else {
          b.classList.remove('is-in');
          void b.offsetWidth; // restart the fade-in
          b.classList.add('is-in');
        }
      } else if (!show) {
        b.hidden = true;
        b.classList.remove('is-in');
      }
    });

    emptyMsg.hidden = on.length > 0;
    origin.textContent = on.length ? on[0].textContent : origin.getAttribute('data-none');

    // nothing ticked: back to a lead, and nothing to mark as won
    if (!on.length) won = false;
    winBtn.disabled = !on.length;
    renderWon(keys);

    var notes = on.map(function (c) { return c.getAttribute('data-note'); }).filter(Boolean);
    note.textContent = notes.join(' ');
    note.hidden = !notes.length;

    // contact buttons quote what was ticked
    var names = on.map(function (c) { return c.textContent; });
    var msg = names.length
      ? cta.getAttribute('data-msg-with').replace('{tools}', joinList(names, cta.getAttribute('data-and')))
      : cta.getAttribute('data-msg-none');
    ctaText.textContent = cta.getAttribute(names.length ? 'data-cta-with' : 'data-cta-none');
    ctaWa.href = cta.getAttribute('data-wa') + '?text=' + encodeURIComponent(msg);
    ctaMail.href = 'mailto:' + cta.getAttribute('data-mail') + '?subject=' + cta.getAttribute('data-subj') + '&body=' + encodeURIComponent(msg);
  }

  function renderWon(keys) {
    pill.textContent = pill.getAttribute(won ? 'data-won' : 'data-lead');
    pill.classList.toggle('is-won', won);
    winBtn.textContent = winBtn.getAttribute(won ? 'data-label-back' : 'data-label-win');
    wonBlock.hidden = !won;
    if (won) {
      Array.prototype.forEach.call(wonBlock.querySelectorAll('[data-needs]'), function (li) {
        li.hidden = keys.indexOf(li.getAttribute('data-needs')) < 0;
      });
    }
  }

  function update() { draw(); writeCard(); firstRun = false; }

  winBtn.addEventListener('click', function () {
    won = !won;
    renderWon(selected().map(function (c) { return c.getAttribute('data-tool'); }));
  });

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
      var name = stage.clientWidth < 440 ? 'narrow' : 'wide';
      if (name !== layoutName) draw();
    }, 120);
  });

  update();
})();
