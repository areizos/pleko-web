/* =========================================================================
   pleko · "Torrent of pills": dictionary terms streaming left to right.
   Labels and one-line meanings are read from the AI dictionary page itself
   (/diccionario-ia/ or /en/ai-glossary/), so they never go stale. Only the
   chosen term ids and which ones "work with" which live here.
   Desktop: the mouse pushes nearby pills away like a magnet; click stops the stream and opens
   a small popup next to the pill, lighting up the pills it works with.
   Phones: slower stream, tap shows the meaning in a panel under the rows.
   Reduced motion: a still wall of pills, same click behaviour.
   ========================================================================= */
(function () {
  'use strict';

  var root = document.getElementById('pills-stream');
  if (!root) return;

  var lang = document.documentElement.lang === 'en' ? 'en' : 'es';
  var DICT = lang === 'en' ? '/en/ai-glossary/' : '/diccionario-ia/';
  var T = lang === 'en'
    ? { works: 'Works with:', full: 'See full AI dictionary', close: 'Close' }
    : { works: 'Funciona con:', full: 'Ver el diccionario de IA completo', close: 'Cerrar' };

  /* Term id (without "t-") -> the terms it works with. Rows are filled in this
     order, a third each, so neighbours on a row are mixed on purpose. */
  var W = {
    'llm': ['prompt', 'tokens', 'contexto'],
    'webhook': ['trigger', 'workflow', 'json'],
    'minimo-privilegio': ['claves-api', 'oauth', 'agente'],
    'rag': ['embeddings', 'grounding', 'base-datos'],
    'crm': ['integracion', 'fuente-unica', 'base-datos'],
    'prompt': ['llm', 'system-prompt', 'few-shot'],
    'api': ['json', 'claves-api', 'integracion'],
    'evals': ['alucinacion', 'prompt', 'sandbox'],
    'ocr': ['extraccion', 'parsing'],
    'agente': ['mcp', 'api', 'human-in-the-loop'],
    'rgpd': ['anonimizacion', 'registro'],
    'json': ['api', 'parsing', 'webhook'],
    'tokens': ['llm', 'contexto'],
    'workflow': ['trigger', 'low-code', 'human-in-the-loop'],
    'mcp': ['agente', 'api', 'oauth'],
    'alucinacion': ['grounding', 'rag', 'evals'],
    'integracion': ['api', 'crm', 'fuente-unica'],
    'human-in-the-loop': ['agente', 'workflow', 'evals'],
    'extraccion': ['ocr', 'json', 'llm'],
    'oauth': ['api', '2fa', 'minimo-privilegio'],
    'system-prompt': ['prompt', 'agente', 'chatbot'],
    'trigger': ['webhook', 'workflow'],
    'embeddings': ['rag', 'base-datos'],
    'sandbox': ['evals', 'backup', 'workflow'],
    'clasificacion': ['llm', 'workflow', 'few-shot'],
    'claves-api': ['api', 'minimo-privilegio'],
    'contexto': ['tokens', 'rag', 'llm'],
    'low-code': ['workflow', 'api', 'webhook'],
    'chatbot': ['llm', 'rag', 'system-prompt'],
    'fuente-unica': ['crm', 'base-datos', 'integracion'],
    'inyeccion-prompts': ['agente', 'prompt', 'human-in-the-loop'],
    'transcripcion': ['llm', 'extraccion'],
    'parsing': ['json', 'extraccion', 'ocr'],
    'grounding': ['rag', 'alucinacion'],
    'base-datos': ['fuente-unica', 'crm', 'json'],
    '2fa': ['oauth', 'minimo-privilegio'],
    'anonimizacion': ['rgpd', 'llm'],
    'few-shot': ['prompt', 'clasificacion'],
    'backup': ['sandbox', 'base-datos'],
    'registro': ['rgpd', 'human-in-the-loop', 'workflow']
  };

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var phone = function () { return window.matchMedia('(max-width: 600px), (hover: none)').matches; };
  var stage = root.querySelector('.stream__stage');
  var panel = root.querySelector('.stream__panel');
  var terms = {};        // id -> { label, def }
  var rows = [];         // { el, track, copy, anim, speed }
  var open = null;       // { id, pill }
  var timer = 0;
  var hovering = false;

  function tilt() { // a crooked angle between 1.5 and 4.5 degrees, either side
    return ((Math.random() < 0.5 ? -1 : 1) * (1.5 + Math.random() * 3)).toFixed(1) + 'deg';
  }


  /* ---------- 1. Read the dictionary ------------------------------------ */
  function load() {
    fetch(DICT, { credentials: 'same-origin' })
      .then(function (r) { if (!r.ok) throw 0; return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        Object.keys(W).forEach(function (id) {
          var item = doc.getElementById('t-' + id);
          if (!item) return;
          var dt = item.querySelector('dt'), dd = item.querySelector('dd');
          // "Disparador (trigger)" -> "Disparador": the pill stays short
          terms[id] = { label: dt.textContent.replace(/\s*\(.*\)\s*$/, '').trim(), def: dd.textContent.trim() };
        });
        build();
      })
      .catch(function () { root.hidden = true; });
  }

  /* ---------- 2. Build the rows ----------------------------------------- */
  function pill(id, clone) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'stream__pill';
    b.dataset.id = id;
    b.textContent = terms[id].label;
    b.style.setProperty('--tilt', tilt());
    b.style.setProperty('--ty', (Math.random() * 10 - 5).toFixed(0) + 'px');
    if (clone) { b.tabIndex = -1; b.setAttribute('aria-hidden', 'true'); }
    return b;
  }

  function build() {
    var ids = Object.keys(W).filter(function (id) { return terms[id]; });
    var n = reduced ? 1 : 3;
    var groups = [];
    for (var r = 0; r < n; r++) groups.push([]);
    ids.forEach(function (id, i) { groups[i % n].push(id); });

    groups.forEach(function (g, r) {
      var row = document.createElement('div');
      row.className = 'stream__row';
      var track = document.createElement('div');
      track.className = 'stream__track';
      var copy = document.createElement('ul');
      copy.className = 'stream__copy';
      g.forEach(function (id) {
        var li = document.createElement('li');
        li.appendChild(pill(id));
        copy.appendChild(li);
      });
      track.appendChild(copy);
      row.appendChild(track);
      stage.appendChild(row);
      rows.push({ el: row, track: track, copy: copy, speed: [1, 1.35, 0.8][r] });
    });
    root.classList.add('is-ready');
    if (!reduced) start();
  }

  /* ---------- 3. Move them (Web Animations, so speed can ease) ----------- */
  function start() {
    var vw = window.innerWidth;
    var base = phone() ? 38 : 80; // pixels per second
    rows.forEach(function (row) {
      // enough copies to cover the screen plus one copy's width
      var w = row.copy.offsetWidth;
      while (row.track.children.length > 1) row.track.removeChild(row.track.lastChild);
      for (var i = 0; i < Math.ceil(vw / w) + 1; i++) {
        var c = row.copy.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        Array.prototype.forEach.call(c.querySelectorAll('button'), function (b) {
          b.tabIndex = -1; b.setAttribute('aria-hidden', 'true');
          b.style.setProperty('--tilt', tilt());
        });
        row.track.appendChild(c);
      }
      if (row.anim) row.anim.cancel();
      row.w = w;
      row.dur = w / (base * row.speed) * 1000;
      row.anim = row.track.animate(
        [{ transform: 'translateX(' + (-w) + 'px)' }, { transform: 'translateX(0)' }],
        { duration: row.dur, iterations: Infinity }
      );
      row.anim.currentTime = Math.random() * row.dur;
      row.anim.playbackRate = cur;
      if (open) row.anim.pause();
    });
  }

  // Speed changes glide over ~0.4 s instead of jumping (a jump reads as a stutter).
  var cur = 1, ramp = 0;
  function rate(r) {
    cancelAnimationFrame(ramp);
    var from = cur, t0 = performance.now();
    (function step(now) {
      var k = Math.min((now - t0) / 400, 1);
      cur = from + (r - from) * k * (2 - k);
      rows.forEach(function (row) { if (row.anim) row.anim.playbackRate = cur; });
      if (k < 1) ramp = requestAnimationFrame(step);
    })(t0);
  }
  function pause() { rows.forEach(function (row) { if (row.anim) row.anim.pause(); }); }
  function resume() {
    rows.forEach(function (row) { if (row.anim) row.anim.play(); });
    rate(hovering && !phone() ? 0.35 : 1);
  }

  /* ---------- 4. The meaning: popup (desktop) or panel (phones) ---------- */
  function fill(box, id) {
    var t = terms[id];
    var works = (W[id] || []).filter(function (w) { return terms[w]; })
      .map(function (w) { return '<span>' + terms[w].label + '</span>'; }).join('');
    box.innerHTML =
      '<p class="stream__term">' + t.label + '</p>' +
      '<p class="stream__def">' + t.def + '</p>' +
      (works ? '<p class="stream__works"><span class="stream__works-label">' + T.works + '</span>' + works + '</p>' : '') +
      '<a class="stream__more" href="' + DICT + '#t-' + id + '">' + T.full + ' <span class="arrow" aria-hidden="true">→</span></a>' +
      '<button type="button" class="stream__close" aria-label="' + T.close + '">×</button>';
  }

  var pop = document.createElement('div');
  pop.className = 'stream__pop';
  pop.setAttribute('role', 'dialog');
  pop.hidden = true;
  root.querySelector('.stream__stage-wrap').appendChild(pop);

  function show(p) {
    var id = p.dataset.id;
    if (open && open.pill === p) { hide(); return; }
    hide(true);
    pause();
    unmagnet();
    open = { id: id, pill: p };
    p.classList.add('is-open');
    // light up every copy of the pills it works with
    (W[id] || []).forEach(function (w) {
      Array.prototype.forEach.call(stage.querySelectorAll('[data-id="' + w + '"]'), function (b) { b.classList.add('is-lit'); });
    });
    root.classList.add('has-open');

    if (phone()) {
      fill(panel, id);
      panel.hidden = false;
    } else {
      fill(pop, id);
      pop.hidden = false;
      place(p);
      arm();
    }
  }

  function place(p) {
    var wrap = pop.parentNode.getBoundingClientRect();
    var r = p.getBoundingClientRect();
    var pw = pop.offsetWidth, ph = pop.offsetHeight;
    var x = r.left - wrap.left + r.width / 2 - pw / 2;
    x = Math.max(8, Math.min(x, wrap.width - pw - 8));
    var below = r.bottom - wrap.top + 10;
    var above = r.top - wrap.top - ph - 10;
    var y = (r.top - wrap.top) > wrap.height / 2 && above > -ph / 2 ? above : below;
    pop.style.left = x + 'px';
    pop.style.top = y + 'px';
  }

  // Auto-close after about 4 s, unless the pointer is on the popup or its pill.
  function arm() {
    clearTimeout(timer);
    timer = setTimeout(function () {
      if (!open) return;
      if (pop.matches(':hover') || open.pill.matches(':hover') || pop.contains(document.activeElement)) { arm(); return; }
      hide();
    }, 4000);
  }

  function hide(silent) {
    clearTimeout(timer);
    if (!open) return;
    open.pill.classList.remove('is-open');
    Array.prototype.forEach.call(stage.querySelectorAll('.is-lit'), function (b) { b.classList.remove('is-lit'); });
    root.classList.remove('has-open');
    pop.hidden = true;
    panel.hidden = true;
    open = null;
    if (!silent) resume();
  }

  /* ---------- 5. Events -------------------------------------------------- */
  stage.addEventListener('click', function (e) {
    var p = e.target.closest('.stream__pill');
    if (p) show(p);
  });
  /* Magnet: the mouse pushes nearby pills away and tilts them, more the
     closer they are. Runs every frame while the mouse is over the stream,
     because the pills keep sliding under a still mouse. The pill right
     under the mouse stays put (only a small tilt), so it can be clicked. */
  var mouse = null, raf = 0, R = 150, PUSH = 26, TURN = 12;
  function setM(p, x, y, r) {
    p._m = [x, y];
    p.style.setProperty('--mx', x.toFixed(1) + 'px');
    p.style.setProperty('--my', y.toFixed(1) + 'px');
    p.style.setProperty('--mr', r.toFixed(1) + 'deg');
  }
  function magnet() {
    raf = 0;
    if (!mouse || open) return;
    // Read every position first, then write: one layout per frame, not one per pill.
    var todo = [];
    rows.forEach(function (row) {
      var rb = row.el.getBoundingClientRect();
      var near = mouse.y > rb.top - R && mouse.y < rb.bottom + R;
      Array.prototype.forEach.call(row.track.querySelectorAll('.stream__pill'), function (p) {
        if (!near) { if (p._mr) todo.push([p, 0, 0, 0]); return; }
        var b = p.getBoundingClientRect(), m = p._m || [0, 0];
        if (b.right < rb.left || b.left > rb.right) { if (p._mr) todo.push([p, 0, 0, 0]); return; }
        var cx = b.left + b.width / 2 - m[0], cy = b.top + b.height / 2 - m[1];
        var dx = cx - mouse.x, dy = cy - mouse.y;
        // distance from the mouse to the pill's edge, not its centre
        var ex = Math.max(Math.abs(dx) - b.width / 2, 0), ey = Math.max(Math.abs(dy) - b.height / 2, 0);
        var d = Math.sqrt(ex * ex + ey * ey);
        if (d >= R) { if (p._mr) todo.push([p, 0, 0, 0]); return; }
        var k = (1 - d / R); k *= k;
        var len = Math.sqrt(dx * dx + dy * dy) || 1;
        var side = dx >= 0 ? 1 : -1;
        if (!d) todo.push([p, 0, 0, side * 4]); // under the mouse: stays clickable
        else todo.push([p, dx / len * PUSH * k, dy / len * PUSH * k, side * TURN * k]);
      });
    });
    todo.forEach(function (t) { setM(t[0], t[1], t[2], t[3]); t[0]._mr = (t[1] || t[2] || t[3]) ? 1 : 0; });
    raf = requestAnimationFrame(magnet);
  }
  function unmagnet() {
    mouse = null;
    cancelAnimationFrame(raf); raf = 0;
    Array.prototype.forEach.call(stage.querySelectorAll('.stream__pill'), function (p) { if (p._mr) { setM(p, 0, 0, 0); p._mr = 0; } });
  }
  /* Only a real mouse move counts. While the page scrolls, the pills slide
     under a still mouse and browsers send fake "moves": ignoring those (and
     letting the pills settle) is what keeps scrolling smooth. */
  var scrolling = false, scrollT = 0;
  window.addEventListener('scroll', function () {
    scrolling = true;
    clearTimeout(scrollT);
    scrollT = setTimeout(function () { scrolling = false; }, 250);
    if (mouse) unmagnet();
  }, { passive: true });
  stage.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse' || phone() || scrolling) return;
    if (mouse && e.clientX === mouse.x && e.clientY === mouse.y) return; // same spot: not a real move
    mouse = { x: e.clientX, y: e.clientY };
    // Mouse over the stream: it eases down so a pill is easy to catch.
    if (!hovering) { hovering = true; if (!open) rate(0.35); }
    if (!raf && !open) raf = requestAnimationFrame(magnet);
  });
  stage.addEventListener('pointerleave', function () {
    unmagnet();
    if (hovering) { hovering = false; if (!open) rate(1); }
  });

  [pop, panel].forEach(function (box) {
    box.addEventListener('click', function (e) { if (e.target.closest('.stream__close')) hide(); });
  });
  pop.addEventListener('pointerleave', arm);
  document.addEventListener('click', function (e) {
    if (open && !e.target.closest('.stream__pill, .stream__pop, .stream__panel')) hide();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && open) { var p = open.pill; hide(); p.focus(); }
  });

  // Keyboard: focusing a pill stops the stream and brings that pill into view.
  stage.addEventListener('focusin', function (e) {
    var p = e.target.closest('.stream__pill');
    if (!p || reduced) return;
    pause();
    var row = rows.filter(function (r) { return r.el.contains(p); })[0];
    row.el.scrollLeft = 0;
    var box = row.el.getBoundingClientRect(), r = p.getBoundingClientRect();
    var dx = 0;
    if (r.left < box.left + 16) dx = box.left + 16 - r.left;
    else if (r.right > box.right - 16) dx = box.right - 16 - r.right;
    if (dx) row.anim.currentTime = ((row.anim.currentTime + dx / row.w * row.dur) % row.dur + row.dur) % row.dur;
  });
  stage.addEventListener('focusout', function (e) {
    if (!open && !stage.contains(e.relatedTarget)) resume();
  });

  var rw = window.innerWidth;
  window.addEventListener('resize', function () {
    if (reduced || !rows.length || Math.abs(window.innerWidth - rw) < 40) return;
    rw = window.innerWidth; hide(true); start();
  });

  // Pause the motion while the section is off screen; load data when near.
  if ('IntersectionObserver' in window) {
    var loaded = false;
    new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (x.isIntersecting && !loaded) { loaded = true; load(); }
        if (!rows.length || reduced) return;
        if (x.isIntersecting && !open) resume(); else if (!x.isIntersecting) pause();
      });
    }, { rootMargin: '400px 0px' }).observe(root);
  } else load();
})();
