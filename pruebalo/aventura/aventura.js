/*
  pleko.es: "Solo lo que necesita tu sí" (hidden A2UI demo, Spanish).

  How it works, in plain words:
  - The tablet shows an inbox of things waiting for your yes. You open one,
    approve it (or change it, or leave it for later) and it ticks off.
  - Four inboxes, one per type of client: autónomos, asesorías, agencias and
    inmobiliarias. The buttons above the tablet switch between them. A sector
    page can start on its own inbox with data-sector="..." on the .av box,
    and any page can use ?sector=... in the address.
  - Every screen is an A2UI message: a JSON description of buttons, cards and
    forms that Google's A2UI renderer (a2ui.js, Apache 2.0) draws. Nothing on
    the tablet is hand-built HTML.
  - Most items are simulations with sample data ("Simulación"). The voice-note
    item is live ("En directo"): the text goes to Alex's n8n, an AI splits it
    into actions, and n8n sends back the A2UI screen.
*/
(function () {
  'use strict';

  var LIVE_URL = 'https://n8n-t5ly.srv2030958.hstgr.cloud/webhook/pleko-aventura-notas';
  var CATALOG = 'https://a2ui.org/specification/v1_0/catalogs/basic/catalog.json';
  var A = window.PlekoA2UI;
  var chat = document.getElementById('av-chat');
  var box = document.querySelector('.av');
  if (!A || !chat || !box) return;

  A.injectBasicCatalogStyles(document);

  var n = 0;
  var pendingMeta = {};
  var processor = new A.MessageProcessor([A.basicCatalog], onAction);

  // ---------- the tablet: one screen, swapped in place ----------
  var badge = document.getElementById('av-badge');
  var title = document.getElementById('av-title');
  var restart = document.getElementById('av-restart');
  var current = null;

  processor.onSurfaceCreated(function (surface) {
    var meta = pendingMeta[surface.id] || { badge: 'sim' };
    if (badge) {
      badge.className = 'demo__badge ' + (meta.badge === 'live' ? 'demo__badge--live' : 'demo__badge--sim');
      badge.textContent = meta.badge === 'live' ? 'En directo' : 'Simulación';
    }
    var el = document.createElement('a2ui-surface');
    el.surface = surface;
    el.className = 'av-screen av-screen--in';
    var old = current;
    current = { el: el, id: surface.id };
    chat.innerHTML = '';
    chat.appendChild(el);
    chat.scrollTop = 0;
    setTimeout(function () { el.classList.remove('av-screen--in'); }, 20);
    if (old) {
      setTimeout(function () {
        try { processor.processMessages([{ version: '1.0', deleteSurface: { surfaceId: old.id } }]); } catch (e) {}
      }, 0);
    }
  });

  // Colour the comparison pills (see stats() below).
  function paint() {
    var els = chat.querySelectorAll('a2ui-basic-text:not(.av-pill)');
    for (var i = 0; i < els.length; i++) {
      var t = els[i].textContent;
      var tone = t.indexOf('\u200C') > -1 ? 'warn' : t.indexOf('\u200B') > -1 ? 'ok' : t.indexOf('\u200D') > -1 ? 'same' : '';
      if (tone) els[i].classList.add('av-pill', 'av-pill--' + tone);
    }
  }
  if (window.MutationObserver) new MutationObserver(paint).observe(chat, { childList: true, subtree: true });

  // A small ripple where the visitor taps, like a finger on a screen.
  chat.addEventListener('pointerdown', function (e) {
    var r = chat.getBoundingClientRect();
    var dot = document.createElement('span');
    dot.className = 'av-tap';
    dot.style.left = (e.clientX - r.left) + 'px';
    dot.style.top = (e.clientY - r.top + chat.scrollTop) + 'px';
    chat.appendChild(dot);
    setTimeout(function () { dot.remove(); }, 600);
  });

  function track(what) {
    try { if (window.umami) window.umami.track('aventura', { sector: sector, paso: what }); } catch (e) {}
  }

  // ---------- icons (24x24 SVG paths, Material Design shapes, Apache 2.0) ----------
  // Drawn as paths so the page needs no icon font: pleko.es loads no third-party fonts.
  var ICONS = {
    check: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
    event: 'M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z',
    calendarToday: 'M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z',
    edit: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
    photo: 'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z',
    search: 'M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
    send: 'M2.01 21L23 12 2.01 3 2 10l15 2-15 2z',
    notifications: 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z',
    mail: 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
    shoppingCart: 'M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0020 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z',
    folder: 'M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z',
    person: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
    home: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
    payment: 'M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z',
    chart: 'M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z',
    help: 'M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z',
    inbox: 'M19 3H4.99C3.88 3 3 3.9 3 5v14c0 1.1.88 2 1.99 2H19c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 12h-4c0 1.66-1.35 3-3 3s-3-1.34-3-3H4.99V5H19v10z'
  };

  // A2UI ids must be plain identifiers (letters, digits, underscores).
  function fixId(x) { return typeof x === 'string' ? x.replace(/[^A-Za-z0-9_]/g, '_') : x; }
  function fixIds(components) {
    return components.map(function (c) {
      var o = Object.assign({}, c, { id: fixId(c.id) });
      if (o.child) o.child = fixId(o.child);
      if (Array.isArray(o.children)) o.children = o.children.map(fixId);
      if (Array.isArray(o.tabs)) o.tabs = o.tabs.map(function (t) { return { title: t.title, child: fixId(t.child) }; });
      if (o.component === 'Icon' && typeof o.name === 'string') o.name = { svgPath: ICONS[o.name] || ICONS.check };
      return o;
    });
  }

  // ---------- tiny helpers to write A2UI components ----------
  function T(id, text, variant) { var c = { id: id, component: 'Text', text: text }; if (variant) c.variant = variant; return c; }
  function Btn(id, label, action, variant, context) {
    return [
      T(id + '-t', label),
      { id: id, component: 'Button', child: id + '-t', variant: variant || 'default',
        action: { event: { name: action, context: context || {} } } }
    ];
  }
  function Ico(id, name) { return { id: id, component: 'Icon', name: name }; }
  function Col(id, kids, extra) { return Object.assign({ id: id, component: 'Column', children: kids }, extra || {}); }
  function Row(id, kids, extra) { return Object.assign({ id: id, component: 'Row', children: kids }, extra || {}); }
  function Card(id, child, extra) { return Object.assign({ id: id, component: 'Card', child: child }, extra || {}); }
  function flat(list) { return [].concat.apply([], list); }
  function wide() { return chat.clientWidth >= 640; }

  // A row with an icon, a bold line and a grey line.
  function line(id, icon, head, sub) {
    var kids = [id + '-a'];
    var out = [Ico(id + '-i', icon), T(id + '-a', '**' + head + '**')];
    if (sub) { kids.push(id + '-b'); out.push(T(id + '-b', sub, 'caption')); }
    out.push(Col(id + '-c', kids, { weight: 1 }));
    out.push(Row(id, [id + '-i', id + '-c'], { align: 'center' }));
    return out;
  }

  // Label on the left, value on the right (invoices, client files, reports).
  function table(id, pairs) {
    var comps = [], ids = [];
    pairs.forEach(function (p, i) {
      comps.push(T(id + 'k' + i, p[0], 'caption'), T(id + 'v' + i, p[1]),
        Row(id + 'r' + i, [id + 'k' + i, id + 'v' + i], { justify: 'spaceBetween', align: 'center' }));
      ids.push(id + 'r' + i);
    });
    comps.push(Col(id + 'col', ids), Card(id, id + 'col'));
    return comps;
  }

  // An editable draft: the visitor can change the text before saying yes.
  function draft(id, label, text) {
    return [{ id: id, component: 'TextField', label: label, variant: 'longText', value: { '@path': '/' + id } }];
  }

  function show(components, opts) {
    opts = opts || {};
    var id = 'av_' + (++n);
    pendingMeta[id] = { badge: opts.badge || 'sim' };
    var msgs = [
      { version: '1.0', createSurface: { surfaceId: id, catalogId: CATALOG, sendDataModel: !!opts.data } },
      { version: '1.0', updateComponents: { surfaceId: id, components: fixIds(components) } }
    ];
    if (opts.data) msgs.push({ version: '1.0', updateDataModel: { surfaceId: id, value: opts.data } });
    processor.processMessages(msgs);
    return id;
  }

  // ---------- charts and comparisons (sample data) ----------
  // Charts are small SVG pictures sent as A2UI Image components, the way an
  // agent would send a chart it drew. Colours: teal = now, grey-green =
  // before, amber = needs attention.
  var C = { teal: '#006565', mid: '#4FA89A', soft: '#B9CFCC', warn: '#D99A00', ink: '#1d2b2b', mute: '#5b6b6a' };
  var FONT = 'font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif"';
  function esc(x) { return String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function svgUrl(svg) { return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); }

  // Bars over time. The last bar is "now" (teal), or amber when warn is set.
  function barsSvg(title, cats) {
    var W = 360, H = 176, top = 40, bottom = 26, n = cats.length, slot = (W - 20) / n, bw = Math.min(44, slot * .55);
    var max = Math.max.apply(null, cats.map(function (c) { return c.v; })) * 1.12;
    var out = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" ' + FONT + '>' +
      '<text x="10" y="18" font-size="13" font-weight="600" fill="' + C.teal + '">' + esc(title) + '</text>' +
      '<line x1="10" x2="' + (W - 10) + '" y1="' + (H - bottom) + '" y2="' + (H - bottom) + '" stroke="#dfe7e6"/>';
    cats.forEach(function (c, i) {
      var h = (H - top - bottom) * c.v / max, x = 10 + slot * i + (slot - bw) / 2, y = H - bottom - h;
      var fill = c.warn ? C.warn : (i === n - 1 ? C.teal : C.soft);
      out += '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + h + '" rx="4" fill="' + fill + '"/>' +
        '<text x="' + (x + bw / 2) + '" y="' + (y - 6) + '" font-size="12" text-anchor="middle" fill="' + C.ink + '"' + (i === n - 1 ? ' font-weight="600"' : '') + '>' + esc(c.t || c.v) + '</text>' +
        '<text x="' + (x + bw / 2) + '" y="' + (H - 8) + '" font-size="11" text-anchor="middle" fill="' + C.mute + '">' + esc(c.l) + '</text>';
    });
    return out + '</svg>';
  }

  // Donut with a legend on the right. A segment with warn is amber.
  function donutSvg(title, segs, centre) {
    var W = 360, H = 176, cx = 82, cy = 102, r = 48, sw = 20, L = 2 * Math.PI * r;
    var total = segs.reduce(function (a, s) { return a + s.v; }, 0), acc = 0, pal = [C.teal, C.mid, C.soft];
    var out = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" ' + FONT + '>' +
      '<text x="10" y="18" font-size="13" font-weight="600" fill="' + C.teal + '">' + esc(title) + '</text>';
    segs.forEach(function (sg, i) {
      var len = L * sg.v / total, col = sg.warn ? C.warn : pal[i % pal.length];
      out += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + col + '" stroke-width="' + sw + '" stroke-dasharray="' + Math.max(len - 2, 0) + ' ' + (L - Math.max(len - 2, 0)) + '" stroke-dashoffset="' + (-acc) + '" transform="rotate(-90 ' + cx + ' ' + cy + ')"/>';
      acc += len;
      var ly = 52 + i * 26;
      out += '<rect x="168" y="' + (ly - 10) + '" width="12" height="12" rx="3" fill="' + col + '"/>' +
        '<text x="188" y="' + ly + '" font-size="12" fill="' + C.ink + '">' + esc(sg.l) + ' <tspan font-weight="600">' + esc(sg.t || sg.v) + '</tspan></text>';
    });
    out += '<text x="' + cx + '" y="' + (cy + 5) + '" font-size="15" font-weight="600" text-anchor="middle" fill="' + C.ink + '">' + esc(centre || total) + '</text>';
    return out + '</svg>';
  }

  function chart(id, c) {
    var svg = c.type === 'donut' ? donutSvg(c.title, c.data, c.centre) : barsSvg(c.title, c.data);
    return [{ id: id, component: 'Image', url: svgUrl(svg), description: c.title, variant: 'mediumFeature', fit: 'contain' }];
  }

  // Comparison rows: label · value · small coloured pill (▲ 12 %).
  // The pill's colour is marked with an invisible character, which paint()
  // below turns into a class (A2UI text has no colour of its own).
  var TONE = { ok: '​', warn: '‌', same: '‍' };
  function stats(id, title, rows) {
    var comps = [T(id + 'h', title, 'caption')], ids = [id + 'h'];
    rows.forEach(function (r, i) {
      var k = id + i, kids = [k + 'l', k + 'v'];
      comps.push(T(k + 'l', r[0], 'caption'), Object.assign(T(k + 'v', '**' + r[1] + '**'), {}));
      if (r[2]) { comps.push(T(k + 'p', r[2] + (TONE[r[3]] || TONE.same))); kids.push(k + 'p'); }
      comps.push(Col(k + 'lc', [k + 'l'], { weight: 1 }));
      comps.push(Row(k, [k + 'lc'].concat(kids.slice(1)), { align: 'center' }));
      ids.push(k);
    });
    comps.push(Col(id + 'col', ids), Card(id, id + 'col'));
    return comps;
  }

  // The context block for an item: an optional chart and the comparisons.
  function context(id, c) {
    if (!c) return [];
    var comps = [], ids = [];
    if (c.chart) { comps = comps.concat(chart(id + 'g', c.chart)); ids.push(id + 'g'); }
    if (c.rows) { comps = comps.concat(stats(id + 's', c.title, c.rows)); ids.push(id + 's'); }
    comps.push(Col(id, ids));
    return comps;
  }

  // Every item screen ends the same way: how things are going, then say yes
  // or leave it for later.
  function decide(item, yesLabel, ctx) {
    var c = (CTX[sector] || {})[item];
    return flat([
      context('ctx', c),
      Btn('yes', yesLabel, 'aprobar', 'primary', Object.assign({ item: item }, ctx || {})),
      Btn('later', 'Ahora no', 'bandeja', 'borderless'),
      [Row('btnrow', ['yes', 'later'], { align: 'center' }),
       Col('decide', c ? ['ctx', 'btnrow'] : ['btnrow'])]
    ]);
  }

  // ---------- sample figures for every item ----------
  // ok = good news (mint pill), warn = needs attention (amber), same = no change.
  var CTX = {
    autonomos: {
      consulta: { title: 'Tus consultas · últimos 7 días vs los 7 anteriores', rows: [
        ['Consultas nuevas', '6', '▲ 50 %', 'ok'],
        ['Tiempo medio de respuesta', '3 h', '▼ 40 %', 'ok'],
        ['Sin contestar desde hace 2 días', '1', 'Atención', 'warn']] },
      notas: { title: 'Tus notas · esta semana vs la pasada', rows: [
        ['Notas dictadas', '9', '▲ 3', 'ok'],
        ['Tareas de notas anteriores sin hacer', '2', 'Atención', 'warn']] },
      factura: { title: 'Noviembre vs octubre', chart: { type: 'donut', title: 'Facturado en noviembre', centre: '3.840 €',
          data: [{ l: 'Cobrado', v: 2690, t: '2.690 €' }, { l: 'Pendiente', v: 670, t: '670 €' }, { l: 'Vencido', v: 480, t: '480 €', warn: true }] },
        rows: [['Facturado', '3.840 €', '▲ 18 %', 'ok'], ['Días medios de cobro', '21', '▼ 5 días', 'ok'], ['Factura vencida hace 12 días', '480 €', 'Reclamar', 'warn']] },
      cita: { title: 'Esta semana vs la pasada', chart: { type: 'bars', title: 'Llamadas con clientes por semana',
          data: [{ l: 'Sem. 44', v: 2 }, { l: 'Sem. 45', v: 3 }, { l: 'Sem. 46', v: 3 }, { l: 'Esta', v: 4 }] },
        rows: [['Llamadas', '4', '▲ 1', 'ok'], ['De llamada a proyecto', '1 de cada 3', 'Igual', 'same'], ['Huecos libres mañana', '1', 'Agenda llena', 'warn']] }
    },
    asesorias: {
      docs: { title: 'Este trimestre vs el anterior', chart: { type: 'donut', title: 'Clientes con la documentación completa', centre: '41',
          data: [{ l: 'Completa', v: 38 }, { l: 'Incompleta', v: 3, warn: true }] },
        rows: [['Clientes con todo entregado', '93 %', '▲ 5 pts', 'ok'], ['Días hasta el plazo', '6', 'Atención', 'warn']] },
      facturas: { title: 'Noviembre vs octubre', chart: { type: 'bars', title: 'Facturas leídas por la IA cada mes',
          data: [{ l: 'Ago', v: 290 }, { l: 'Sep', v: 338 }, { l: 'Oct', v: 337 }, { l: 'Nov', v: 412 }] },
        rows: [['Facturas leídas', '412', '▲ 22 %', 'ok'], ['Leídas sin corregir nada', '97 %', '▲ 2 pts', 'ok'], ['Con un IVA que no cuadra', '1', 'Revisar', 'warn']] },
      consulta: { title: 'Hoy vs el martes pasado', rows: [
        ['Emails de clientes', '27', '▲ 35 %', 'warn'],
        ['Contestados con un borrador listo', '21 de 27', '▲ 9', 'ok'],
        ['Con datos personales ocultados', '6', 'Igual', 'same']] },
      alta: { title: 'Noviembre vs octubre', rows: [
        ['Altas de clientes', '5', '▲ 2', 'ok'],
        ['Tiempo medio de alta', '1 día', '▼ 3 días', 'ok'],
        ['Falta el certificado censal', '1', 'Pedir', 'warn']] }
    },
    agencias: {
      alta: { title: 'Este cliente vs el anterior', rows: [
        ['Tiempo hasta empezar a trabajar', '1 día', '▼ 4 días', 'ok'],
        ['Tareas creadas solas', '18', '▲ 18', 'ok'],
        ['Accesos recibidos', '2 de 3', 'Falta Meta', 'warn']] },
      post: { title: 'Este mes vs el anterior', chart: { type: 'bars', title: 'Interacción media de este cliente (%)',
          data: [{ l: 'LinkedIn', v: 4.1, t: '4,1 %' }, { l: 'Instagram', v: 5.3, t: '5,3 %' }, { l: 'Newsletter', v: 3.1, t: '3,1 %', warn: true }] },
        rows: [['LinkedIn', '4,1 %', '▲ 0,6 pts', 'ok'], ['Instagram', '5,3 %', '▲ 1,1 pts', 'ok'], ['Newsletter (apertura)', '31 %', '▼ 4 pts', 'warn']] },
      ia: { title: 'Este mes vs el anterior', rows: [
        ['Preguntas del equipo sobre IA', '7', '▲ 3', 'ok'],
        ['Normas de uso escritas', '4 de 5', 'Falta una', 'warn']] }
    },
    inmobiliarias: {
      contactos: { title: 'Últimos 7 días vs los 7 anteriores', chart: { type: 'donut', title: 'Contactos por origen', centre: '23',
          data: [{ l: 'Idealista', v: 11 }, { l: 'Tu web', v: 7 }, { l: 'Fotocasa', v: 5, warn: true }] },
        rows: [['Contactos', '23', '▲ 28 %', 'ok'], ['Contestados en menos de 1 hora', '91 %', '▲ 30 pts', 'ok'], ['Desde Fotocasa', '5', '▼ 30 %', 'warn']] },
      visita: { title: 'Esta semana vs la pasada', chart: { type: 'bars', title: 'Visitas por semana',
          data: [{ l: 'Sem. 44', v: 6 }, { l: 'Sem. 45', v: 7 }, { l: 'Sem. 46', v: 7 }, { l: 'Esta', v: 9 }] },
        rows: [['Visitas', '9', '▲ 2', 'ok'], ['Ático: visitas sin oferta', '3', 'Revisar precio', 'warn']] },
      anuncio: { title: 'Noviembre vs octubre', rows: [
        ['Anuncios activos', '14', '▲ 2', 'ok'],
        ['Días medios hasta reservar', '38', '▼ 6 días', 'ok'],
        ['Sin fotos nuevas en 60 días', '2', 'Atención', 'warn']] },
      seguimiento: { title: 'Este mes vs el anterior', chart: { type: 'donut', title: 'Visitas de noviembre', centre: '21',
          data: [{ l: 'Con respuesta', v: 17 }, { l: 'Sin respuesta', v: 4, warn: true }] },
        rows: [['Visitas con seguimiento', '85 %', '▲ 20 pts', 'ok'], ['Sin respuesta tras 7 días', '4', 'Escribir', 'warn']] }
    }
  };

  // ---------- the four inboxes ----------
  // Each item: what the inbox shows, the screen it opens, and what the
  // inbox says once it's approved. All names and numbers are sample data.
  var SECTORES = {
    autonomos: {
      nombre: 'Autónomos',
      tema: 'Eres toda la empresa',
      dia: 'Lunes 9:14',
      intro: 'Vendes, haces el trabajo, facturas y contestas correos. Esta mañana, tu asistente ya ha preparado esto:',
      pagina: '/ia-para-autonomos/',
      items: [
        { id: 'consulta', icon: 'mail', head: 'Respuesta lista para una consulta nueva', sub: 'Marta pregunta por un logotipo para su tienda',
          hecho: 'Respuesta enviada a Marta, con tu enlace para una llamada.',
          open: function () {
            return show(flat([
              [T('h', 'Marta te ha escrito desde tu web: **«Hola, necesito un logotipo para mi tienda. ¿Cómo trabajas?»**'),
               T('p', 'Tu asistente ha preparado la respuesta con tu forma de escribir. Puedes cambiarla antes de enviarla:')],
              draft('borrador', 'Borrador de respuesta'),
              decide('consulta', 'Enviar a Marta'),
              [Col('root', ['h', 'p', 'borrador', 'decide'])]
            ]), { data: { borrador: 'Hola, Marta: gracias por escribirme. Para un logotipo empiezo siempre con una llamada corta de 20 minutos para entender tu tienda, y después te paso un presupuesto cerrado. ¿Te va bien el jueves o el viernes por la mañana? Un saludo.' } });
          } },
        { id: 'notas', icon: 'edit', head: 'Tus notas de voz de esta mañana', sub: 'Un audio de un minuto con varias cosas mezcladas', live: true,
          hecho: 'Tus notas, ordenadas: cada cosa en su sitio.',
          open: function () {
            return show(flat([
              [T('h', 'Ibas en el coche y dictaste lo que se te pasaba por la cabeza. Escríbelo aquí como si lo dijeras en voz alta, o deja el ejemplo.'),
               { id: 'texto', component: 'TextField', label: 'Tu nota de voz (en texto)', variant: 'longText', value: { '@path': '/texto' } },
               T('priv', 'El texto pasa por mi servidor de automatizaciones y por un modelo de IA de OpenAI para leerlo. Yo no lo guardo. No escribas datos personales reales.', 'caption')],
              context('ctx', CTX.autonomos.notas),
              Btn('go', 'Ordénalo', 'notas-enviar', 'primary', { texto: { '@path': '/texto' } }),
              Btn('later', 'Ahora no', 'bandeja', 'borderless'),
              [Row('btns', ['go', 'later'], { align: 'center' }),
               Col('root', ['h', 'texto', 'priv', 'ctx', 'btns'])]
            ]), { badge: 'live', data: { texto: 'Vale, a ver: mañana llamar a Marta por lo del logotipo, comprar tinta para la impresora, mandarle a Jordi las fotos del proyecto antes del viernes y pedir cita con la gestora el martes a las diez.' } });
          } },
        { id: 'factura', icon: 'payment', head: 'Factura lista para enviar', sub: 'Proyecto terminado para Estudio Ejemplo',
          hecho: 'Factura enviada. Si no está pagada en 30 días, te aviso.',
          open: function () {
            return show(flat([
              [T('h', 'Has marcado el proyecto como terminado, así que la factura ya está hecha con los datos del cliente:')],
              table('fac', [['Cliente', 'Estudio Ejemplo S.L.'], ['Concepto', 'Diseño de página web'], ['Base', '1.200,00 €'],
                ['IVA (21 %)', '252,00 €'], ['Retención IRPF (15 %)', '−180,00 €'], ['Total', '**1.272,00 €**']]),
              [T('c', 'Se enviará con un email de agradecimiento y la fecha de pago.', 'caption')],
              decide('factura', 'Enviar la factura'),
              [Col('root', ['h', 'fac', 'c', 'decide'])]
            ]));
          } },
        { id: 'cita', icon: 'event', head: 'Llamada de mañana a las 10:00', sub: '¿Le mando el enlace y un recordatorio al cliente?',
          hecho: 'Enlace enviado. El cliente recibirá un recordatorio una hora antes.',
          open: function () {
            return show(flat([
              line('l', 'calendarToday', 'Mañana, 10:00 · Llamada de 20 minutos', 'Con un cliente nuevo que reservó desde tu web'),
              [Card('card', 'l'), T('p', 'Tu asistente puede mandarle ahora el enlace de la videollamada y un recordatorio una hora antes.')],
              decide('cita', 'Sí, mándalo'),
              [Col('root', ['card', 'p', 'decide'])]
            ]));
          } }
      ]
    },

    asesorias: {
      nombre: 'Asesorías',
      tema: 'Cierre de trimestre',
      dia: 'Martes 8:52',
      intro: 'Es la semana de los impuestos y el correo no para. Tu asistente ha preparado esto:',
      pagina: '/ia-para-asesorias/',
      items: [
        { id: 'docs', icon: 'folder', head: 'Faltan documentos de 3 clientes', sub: '¿Les mando un recordatorio con su lista?',
          hecho: 'Recordatorio enviado, cada cliente con lo que le falta.',
          open: function () {
            return show(flat([
              [T('h', 'Estos clientes aún no han enviado todo para el trimestre. Marca a quién quieres recordárselo:'),
               { id: 'c1', component: 'CheckBox', label: 'Panadería · faltan 2 facturas de proveedor', value: { '@path': '/c1' } },
               { id: 'c2', component: 'CheckBox', label: 'Fisioterapeuta · falta el extracto del banco', value: { '@path': '/c2' } },
               { id: 'c3', component: 'CheckBox', label: 'Diseñadora · faltan las facturas emitidas de noviembre', value: { '@path': '/c3' } },
               T('p', 'Cada uno recibe un email con su lista y un enlace para subir los documentos.', 'caption')],
              decide('docs', 'Enviar recordatorios'),
              [Col('root', ['h', 'c1', 'c2', 'c3', 'p', 'decide'])]
            ]), { data: { c1: true, c2: true, c3: true } });
          } },
        { id: 'facturas', icon: 'photo', head: '4 facturas leídas, esperando tu revisión', sub: 'Llegaron por email y por foto',
          hecho: 'Facturas guardadas en la contabilidad del cliente, con su imagen adjunta.',
          open: function () {
            return show(flat([
              [T('h', 'La IA ha leído las facturas y ha sacado los datos. Esta es la primera; las otras tres coinciden con sus proveedores de siempre.')],
              table('fac', [['Proveedor', 'Suministros Ejemplo S.L.'], ['Fecha', '18/11/2026'], ['Concepto', 'Material de oficina'],
                ['Base', '120,00 €'], ['IVA (21 %)', '25,20 €'], ['Total', '**145,20 €**']]),
              [T('c', 'Antes de guardar nada, una persona lo revisa. La IA lee muy bien, pero no es infalible.', 'caption')],
              decide('facturas', 'Todo correcto, guardar'),
              [Col('root', ['h', 'fac', 'c', 'decide'])]
            ]));
          } },
        { id: 'consulta', icon: 'mail', head: 'Respuesta a un cliente', sub: 'Ana pregunta si os llegó su documentación',
          hecho: 'Respuesta enviada a Ana.',
          open: function () {
            return show(flat([
              [T('h', 'Ana escribe: **«¿Os llegó todo? Mi DNI es [DNI oculto] y la cuenta [IBAN oculto], por si lo necesitáis.»**'),
               T('d', 'Antes de pasar por la IA, el DNI y la cuenta se han ocultado. Los datos de tus clientes no salen de tu despacho.', 'caption')],
              draft('borrador', 'Borrador de respuesta'),
              decide('consulta', 'Enviar a Ana'),
              [Col('root', ['h', 'd', 'borrador', 'decide'])]
            ]), { data: { borrador: 'Hola, Ana: sí, nos llegó todo el martes. Solo falta el extracto del banco de octubre. ¿Nos lo puedes subir por el enlace de siempre? Gracias.' } });
          } },
        { id: 'alta', icon: 'person', head: 'Alta de un cliente nuevo', sub: 'Ha rellenado el formulario de tu web',
          hecho: 'Ficha creada y carpeta preparada. Le llega un email de bienvenida.',
          open: function () {
            return show(flat([
              [T('h', 'Un cliente nuevo ha rellenado el formulario. Su ficha ya está preparada:')],
              table('ficha', [['Actividad', 'Estudio de yoga'], ['Forma', 'Autónoma'], ['Alta en Hacienda', 'Desde enero'],
                ['Servicio', 'Contabilidad e impuestos trimestrales']]),
              [T('c', 'Al aprobar, se crea su carpeta y le llega la lista de documentos que necesitáis.', 'caption')],
              decide('alta', 'Crear ficha y carpeta'),
              [Col('root', ['h', 'ficha', 'c', 'decide'])]
            ]));
          } }
      ]
    },

    agencias: {
      nombre: 'Agencias',
      tema: 'El lunes toca informes',
      dia: 'Lunes 9:30',
      intro: 'Tu equipo quiere crear, no copiar números. Tu asistente ha preparado esto:',
      pagina: '/ia-para-agencias/',
      items: [
        { id: 'informe', icon: 'chart', head: 'Informe mensual listo', sub: 'Para un cliente de comercio local · noviembre',
          hecho: 'Informe enviado al cliente, con tu comentario arriba.',
          open: function () {
            return show(flat([
              [T('h', 'El informe se ha montado solo con los datos del mes. Noviembre comparado con octubre, datos de ejemplo:')],
              context('web', { title: 'Web · noviembre vs octubre',
                chart: { type: 'bars', title: 'Visitas por semana', data: [{ l: 'Sem. 44', v: 880, t: '880' }, { l: 'Sem. 45', v: 990, t: '990' }, { l: 'Sem. 46', v: 1090, t: '1.090' }, { l: 'Sem. 47', v: 1220, t: '1.220' }] },
                rows: [['Visitas', '4.180', '▲ 12 %', 'ok'], ['Contactos desde la web', '37', '▲ 8 %', 'ok'], ['Conversión', '0,9 %', '▼ 0,1 pts', 'warn']] }),
              context('redes', { title: 'Redes · noviembre vs octubre',
                chart: { type: 'donut', title: 'Interacciones por red', centre: '1.240', data: [{ l: 'Instagram', v: 720 }, { l: 'LinkedIn', v: 310 }, { l: 'Facebook', v: 210 }] },
                rows: [['Interacciones', '1.240', '▲ 15 %', 'ok'], ['Seguidores nuevos', '86', '▲ 4 %', 'ok'], ['Alcance', '9.800', '▼ 18 %', 'warn']] }),
              context('ads', { title: 'Anuncios · noviembre vs octubre',
                chart: { type: 'bars', title: 'Coste por contacto (€)', data: [{ l: 'Ago', v: 12, t: '12 €' }, { l: 'Sep', v: 13, t: '13 €' }, { l: 'Oct', v: 13, t: '13 €' }, { l: 'Nov', v: 16, t: '16 €', warn: true }] },
                rows: [['Inversión', '600 €', 'Igual', 'same'], ['Clics', '910', '▲ 6 %', 'ok'], ['Coste por contacto', '16 €', '▲ 23 %', 'warn']] }),
              [{ id: 'tabs', component: 'Tabs', tabs: [{ title: 'Web', child: 'web' }, { title: 'Redes', child: 'redes' }, { title: 'Anuncios', child: 'ads' }] },
               T('c', 'Tú solo añades la lectura: qué ha pasado y qué haremos en diciembre.', 'caption')],
              decide('informe', 'Enviar al cliente'),
              [Col('root', ['h', 'tabs', 'c', 'decide'])]
            ]));
          } },
        { id: 'alta', icon: 'folder', head: 'Cliente nuevo: todo preparado', sub: 'Falta tu visto bueno para darle la bienvenida',
          hecho: 'Bienvenida enviada. El equipo ya tiene su tablero.',
          open: function () {
            return show(flat([
              [T('h', 'Al firmar, se ha preparado todo esto sin que nadie lo haga a mano:')],
              line('s1', 'check', 'Carpeta del cliente', 'Con las plantillas de siempre'),
              line('s2', 'check', 'Tablero del proyecto', 'Con las tareas del primer mes'),
              line('s3', 'check', 'Canal del equipo', 'Con las personas asignadas'),
              line('s4', 'check', 'Petición de accesos', 'Web, redes y anuncios, en un solo email'),
              [Col('pasos', ['s1', 's2', 's3', 's4'])],
              decide('alta', 'Dar la bienvenida'),
              [Col('root', ['h', 'pasos', 'decide'])]
            ]));
          } },
        { id: 'post', icon: 'send', head: '3 versiones de un post', sub: 'A partir de una idea de una línea',
          hecho: 'Publicaciones programadas para esta semana.',
          open: function () {
            return show(flat([
              [T('h', 'Idea de partida: **«Nuestro cliente cumple 10 años en el barrio».**'),
               T('li', 'Diez años abriendo la persiana cada mañana. Gracias a los vecinos que nos han hecho parte del barrio. Esta semana lo celebramos con vosotros.'),
               T('ig', 'Diez años. Miles de cafés. Un barrio entero. Gracias por estar. Esta semana, sorpresa en el mostrador.'),
               T('nl', 'Este mes celebramos diez años. Te contamos cómo empezó todo y te invitamos a pasar por la tienda esta semana.'),
               { id: 'tabs', component: 'Tabs', tabs: [{ title: 'LinkedIn', child: 'li' }, { title: 'Instagram', child: 'ig' }, { title: 'Newsletter', child: 'nl' }] },
               T('c', 'La IA propone, una persona del equipo decide.', 'caption')],
              decide('post', 'Programar las tres'),
              [Col('root', ['h', 'tabs', 'c', 'decide'])]
            ]));
          } },
        { id: 'ia', icon: 'help', head: 'Pregunta del equipo', sub: 'Lucía quiere usar la IA con un contrato',
          hecho: 'Respondido. La norma queda en la guía del equipo.',
          open: function () {
            return show(flat([
              [T('h', 'Lucía pregunta: **«¿Puedo pegar el contrato de un cliente en ChatGPT para resumirlo?»**'),
               { id: 'r', component: 'ChoicePicker', label: 'Tu respuesta', variant: 'mutuallyExclusive', displayStyle: 'chips',
                 options: [{ label: 'Sí, sin problema', value: 'si' }, { label: 'Sí, pero quitando antes los datos', value: 'datos' }, { label: 'No', value: 'no' }],
                 value: { '@path': '/r' } },
               T('c', 'Con unas normas claras, el equipo usa la IA con criterio y nadie tiene que preguntar dos veces.', 'caption')],
              decide('ia', 'Responder a Lucía', { r: { '@path': '/r' } }),
              [Col('root', ['h', 'r', 'c', 'decide'])]
            ]), { data: { r: ['datos'] } });
          } }
      ]
    },

    inmobiliarias: {
      nombre: 'Inmobiliarias',
      tema: 'Sábado, tres contactos a la vez',
      dia: 'Sábado 11:20',
      intro: 'Estás enseñando un piso y el móvil no para. Tu asistente ha preparado esto:',
      pagina: '/ia-para-inmobiliarias/',
      items: [
        { id: 'contactos', icon: 'inbox', head: '3 contactos nuevos de los portales', sub: 'Con la respuesta ya preparada',
          hecho: 'Las tres respuestas enviadas, cada una con huecos para visitar.',
          open: function () {
            return show(flat([
              [T('h', 'Han llegado de sitios distintos, pero los tienes en un solo lugar:')],
              line('l1', 'home', 'Idealista · Piso de 3 habitaciones', 'Pregunta si admite mascotas'),
              line('l2', 'home', 'Fotocasa · Ático con terraza', 'Quiere visitarlo esta semana'),
              line('l3', 'home', 'Tu web · Local comercial', 'Pregunta por el precio del alquiler'),
              [Col('lista', ['l1', 'l2', 'l3']),
               T('c', 'Cada respuesta contesta su pregunta con los datos del anuncio y ofrece dos horas para visitarlo.', 'caption')],
              decide('contactos', 'Enviar las tres respuestas'),
              [Col('root', ['h', 'lista', 'c', 'decide'])]
            ]));
          } },
        { id: 'visita', icon: 'event', head: 'Visita para confirmar', sub: 'Ático con terraza · quiere ir el martes',
          hecho: 'Visita confirmada. Recordatorio automático el día antes.',
          open: function () {
            return show(flat([
              [T('h', 'El interesado en el ático puede el martes. Estos huecos están libres en tu agenda:'),
               { id: 'hora', component: 'ChoicePicker', label: 'Hora de la visita', variant: 'mutuallyExclusive', displayStyle: 'chips',
                 options: [{ label: '10:30', value: '10:30' }, { label: '12:00', value: '12:00' }, { label: '17:30', value: '17:30' }],
                 value: { '@path': '/hora' } },
               T('c', 'Al confirmar, le llega la dirección y un recordatorio el día antes. A ti también.', 'caption')],
              decide('visita', 'Confirmar visita', { hora: { '@path': '/hora' } }),
              [Col('root', ['h', 'hora', 'c', 'decide'])]
            ]), { data: { hora: ['12:00'] } });
          } },
        { id: 'anuncio', icon: 'edit', head: 'Texto del anuncio de un piso nuevo', sub: 'A partir de tus notas de la visita',
          hecho: 'Texto guardado, listo para pegarlo en el portal.',
          open: function () {
            return show(flat([
              [T('h', 'Tus notas: **3 hab., 2 baños, reformado, mucha luz, balcón, cerca del metro, 4.º con ascensor.**'),
               T('p', 'El texto del anuncio, preparado. Cámbialo si quieres:')],
              draft('borrador', 'Texto del anuncio'),
              decide('anuncio', 'Guardar el texto'),
              [Col('root', ['h', 'p', 'borrador', 'decide'])]
            ]), { data: { borrador: 'Piso reformado de 3 habitaciones y 2 baños, en una cuarta planta con ascensor. Mucha luz natural durante todo el día y un balcón para el café de la mañana. A pocos minutos del metro. Listo para entrar a vivir.' } });
          } },
        { id: 'seguimiento', icon: 'notifications', head: 'Seguimiento de una visita', sub: 'Visitaron el piso de 3 habitaciones hace 7 días',
          hecho: 'Mensaje de seguimiento enviado.',
          open: function () {
            return show(flat([
              [T('h', 'Hace una semana que una pareja visitó el piso y no han dicho nada. Tu asistente propone escribirles:')],
              draft('borrador', 'Mensaje de seguimiento'),
              decide('seguimiento', 'Enviar mensaje'),
              [Col('root', ['h', 'borrador', 'decide'])]
            ]), { data: { borrador: 'Hola, ¿qué tal? Os escribo por el piso que visitasteis la semana pasada. ¿Os quedó alguna duda? Si queréis volver a verlo, esta semana tengo huecos el jueves por la tarde.' } });
          } }
      ]
    }
  };

  // ---------- "Detrás de esta pantalla": the panel next to the tablet ----------
  // For each screen: where it comes from, what happens on its own, where it
  // goes, and what you decide. Tool names are examples of what people in
  // Spain already use; the point is that nothing here is a new app.
  var IA = 'ChatGPT o Claude', AQUI = 'Esta bandeja';
  function P(t, lead, de, deT, hecho, hechoT, a, aT, tu) {
    return { t: t, lead: lead, flow: [['De dónde viene', de, deT], ['Qué se hace solo', hecho, hechoT], ['Adónde va', a, aT]], tu: tu };
  }
  var PANEL = {
    autonomos: {
      _inbox: P('Tus herramientas de siempre, en una sola bandeja',
        'Lo que antes estaba repartido entre el correo, WhatsApp y tus notas llega aquí ya preparado. No es un programa nuevo: son tus herramientas, conectadas.',
        ['Gmail', 'WhatsApp', 'Formulario de tu web'], 'Cada cosa entra por donde ya entraba.',
        [IA], 'Lee, ordena y prepara cada cosa.',
        [AQUI], 'Solo te llega lo que necesita tu decisión.',
        'Nada sale sin tu sí.'),
      consulta: P('Una consulta, respondida en tu tono',
        'La respuesta sale de tu propia cuenta de correo. El cliente no nota ninguna herramienta nueva.',
        ['Tally', 'Gmail'], 'Alguien rellena el formulario de tu web y llega a tu correo.',
        [IA], 'Escribe la respuesta como escribes tú, con tus servicios y tu enlace para una llamada.',
        ['Gmail', 'WhatsApp Business'], 'Se envía desde tu cuenta, como si la hubieras escrito tú.',
        'Lees el borrador, cambias lo que quieras y lo envías.'),
      notas: P('De una nota de voz a tareas',
        'Este paso funciona de verdad: escribe tu nota y mira cómo la IA la separa en acciones.',
        ['WhatsApp'], 'Te mandas un audio, como ya haces cuando vas con prisa.',
        ['Transcripción', IA], 'Lo pasa a texto y lo separa en tareas, citas, correos y compras.',
        ['Notion', 'Trello', 'Google Calendar', 'Gmail'], 'Cada cosa va a su sitio: tareas, agenda y borradores.',
        'Revisas la lista antes de guardar nada.'),
      factura: P('Proyecto terminado, factura hecha',
        'El gráfico sale de tus cobros reales en tu programa de facturación, no de una hoja aparte.',
        ['Trello'], 'Mueves la tarjeta del proyecto a «Terminado».',
        ['Holded'], 'Se crea la factura con los datos del cliente, el IVA y la retención.',
        ['Gmail'], 'Se envía con un email de agradecimiento. Si a los 30 días no está pagada, te aviso.',
        'Revisas los importes y das el sí.'),
      cita: P('Una llamada que se organiza sola',
        'Tu agenda, tu enlace de videollamada y tu WhatsApp, trabajando juntos.',
        ['Cal.com'], 'El cliente reservó la llamada desde tu web.',
        ['Google Calendar', 'Google Meet'], 'La cita y el enlace de la videollamada se crean solos.',
        ['WhatsApp Business', 'Gmail'], 'El cliente recibe el enlace y un recordatorio una hora antes.',
        'Decides si se envía.')
    },
    asesorias: {
      _inbox: P('El trimestre, sin perseguir a nadie',
        'Emails, fotos de tickets y documentos que faltan: aquí te llega solo lo que necesita a una persona del despacho.',
        ['Outlook', 'Gmail', 'WhatsApp', 'Google Drive'], 'Lo que ya os llega cada día.',
        [IA, 'Google Sheets'], 'Lee, clasifica y prepara cada respuesta.',
        [AQUI], 'Solo lo que necesita vuestra revisión.',
        'Ningún dato sale sin que una persona lo vea.'),
      docs: P('Quién ha entregado y quién no',
        'El gráfico se actualiza solo a partir de las carpetas de cada cliente.',
        ['Google Drive'], 'Se revisa la carpeta de cada cliente y se ve qué falta del trimestre.',
        ['Google Sheets'], 'Se lleva la cuenta de quién lo tiene todo. De ahí sale el gráfico.',
        ['Gmail', 'WhatsApp Business'], 'Cada cliente recibe su lista y un enlace para subir lo que falta.',
        'Eliges a quién se lo recuerdas.'),
      facturas: P('Facturas leídas, no tecleadas',
        'La IA lee muy bien, pero no es infalible. Por eso marca lo que no cuadra y una persona lo revisa.',
        ['Gmail', 'WhatsApp'], 'Las facturas llegan por email o en foto.',
        [IA], 'Lee proveedor, fecha, base e IVA, y marca lo que no cuadra.',
        ['Google Sheets', 'Holded'], 'Los datos van a la contabilidad, con la imagen adjunta.',
        'Una persona revisa antes de guardar.'),
      consulta: P('Respuestas rápidas, datos protegidos',
        'Antes de que la IA vea nada, el DNI y las cuentas se ocultan.',
        ['Outlook', 'Gmail'], 'El email del cliente entra como siempre.',
        ['Filtro de datos personales', IA], 'Primero se ocultan los datos; después se prepara la respuesta.',
        ['Outlook', 'Gmail'], 'La respuesta sale desde el correo del despacho.',
        'Revisas y envías.'),
      alta: P('Un cliente nuevo, ya dado de alta',
        'Del formulario a la carpeta, sin copiar y pegar.',
        ['Tally'], 'El cliente rellena el formulario de vuestra web.',
        ['Google Drive', 'Notion'], 'Se crean su carpeta y su ficha.',
        ['Gmail'], 'Le llega la bienvenida con la lista de documentos.',
        'Compruebas la ficha y das el sí.')
    },
    agencias: {
      _inbox: P('Menos copiar números, más criterio',
        'Los datos están en cinco sitios distintos. Aquí llegan juntos, comparados y listos para que tu equipo los lea.',
        ['Google Analytics', 'Meta Business Suite', 'Google Ads', 'Slack'], 'Las plataformas que ya usáis.',
        ['Google Sheets', IA], 'Recoge, compara y prepara.',
        [AQUI], 'Solo lo que necesita una decisión.',
        'La IA propone; una persona del equipo decide.'),
      informe: P('El informe que se monta solo',
        'Cada gráfico sale de las cuentas reales del cliente, comparado con el mes anterior. Lo que baja se marca en ámbar.',
        ['Google Analytics', 'Meta Business Suite', 'Google Ads'], 'Los datos del mes se recogen solos de cada plataforma.',
        ['Google Sheets'], 'Se comparan con el mes anterior y se marca lo que necesita atención.',
        ['Google Slides', 'Gmail'], 'El informe se monta con vuestra plantilla y se envía al cliente.',
        'Tú añades la lectura y das el sí.'),
      alta: P('Cliente firmado, todo preparado',
        'Lo que antes era una mañana de configurar cosas, listo antes del primer café.',
        ['Gmail'], 'Llega el contrato firmado.',
        ['Google Drive', 'Trello', 'Asana', 'Slack'], 'Carpeta, tablero con las tareas del primer mes y canal del equipo.',
        ['Gmail'], 'Al cliente le llega la bienvenida y una sola petición de accesos.',
        'Revisas y das la bienvenida.'),
      post: P('Una idea, tres canales',
        'La IA hace el primer borrador. El estilo y la decisión final siguen siendo de tu equipo.',
        ['Notion'], 'La idea está en vuestro calendario de contenidos.',
        [IA, 'Canva'], 'Tres versiones del texto, una por canal, y la imagen con vuestra plantilla.',
        ['Meta Business Suite', 'LinkedIn'], 'Se programan en cada red.',
        'Una persona del equipo elige y retoca.'),
      ia: P('Normas claras para usar la IA',
        'Con unas normas escritas, nadie tiene que preguntar dos veces.',
        ['Slack'], 'Alguien del equipo pregunta en el canal.',
        ['Notion'], 'Se busca si ya hay una norma escrita.',
        ['Slack', 'Notion'], 'La respuesta vuelve al canal y la norma queda en la guía del equipo.',
        'Tú decides la norma.')
    },
    inmobiliarias: {
      _inbox: P('Todos los contactos, en un solo sitio',
        'Cada portal avisa por su lado. Aquí llegan juntos y con la respuesta preparada, aunque estés enseñando un piso.',
        ['Idealista', 'Fotocasa', 'WhatsApp', 'Tu web'], 'Por donde ya te llegan.',
        [IA, 'Google Sheets'], 'Prepara cada respuesta y lo apunta todo.',
        [AQUI], 'Solo lo que necesita tu sí.',
        'Nada sale sin tu sí.'),
      contactos: P('Tres contactos, tres respuestas',
        'Contestar rápido marca la diferencia. Aquí la respuesta ya está escrita con los datos del anuncio.',
        ['Idealista', 'Fotocasa', 'Tu web'], 'Cada portal te avisa por email de un contacto nuevo.',
        [IA], 'Responde su pregunta con los datos del anuncio y propone dos horas de visita.',
        ['Gmail', 'WhatsApp Business', 'Google Sheets'], 'La respuesta sale y el contacto queda apuntado en tu lista.',
        'Revisas y envías las tres.'),
      visita: P('Visitas sin ir y venir de mensajes',
        'Tu agenda decide qué horas se ofrecen; nadie tiene que mirarla a mano.',
        ['Google Calendar'], 'Se miran tus huecos libres.',
        ['WhatsApp Business'], 'Se confirma la hora con el interesado.',
        ['Google Calendar', 'WhatsApp Business'], 'Cita en tu agenda y recordatorio el día antes, para los dos.',
        'Eliges la hora y confirmas.'),
      anuncio: P('De tus notas a un anuncio',
        'Tus notas de la visita, convertidas en un texto que vende sin inventar nada.',
        ['WhatsApp', 'Notas del móvil'], 'Tus notas de la visita, escritas o dictadas.',
        [IA], 'Las convierte en el texto del anuncio.',
        ['Google Docs'], 'Queda listo para pegarlo en el portal.',
        'Lo lees, lo cambias si quieres y lo guardas.'),
      seguimiento: P('Ningún interesado se queda sin respuesta',
        'El seguimiento a los 7 días es lo primero que se olvida. Aquí no.',
        ['Google Sheets'], 'Tu lista de visitas, con la fecha de cada una.',
        [IA], 'A los 7 días sin noticias, prepara un mensaje personal.',
        ['WhatsApp Business'], 'El mensaje sale desde tu número.',
        'Decides si se envía.')
    }
  };
  var PANEL_VACIA = { t: 'Así podría ser tu semana', lead: 'Cada conexión se monta a medida, con las herramientas que ya usas, empezando por lo que más tiempo te quita. Primero simplifico, luego automatizo.', tu: 'Tú sigues decidiendo; lo repetitivo ya viene hecho.' };

  var side = document.getElementById('av-side');
  var sideKey = '';
  function h(x) { return String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function chips(list) {
    return '<span class="av-chips">' + list.map(function (c) {
      var cls = c === IA ? ' av-chip--ia' : c === AQUI ? ' av-chip--here' : '';
      return '<span class="av-chip' + cls + '">' + h(c) + '</span>';
    }).join('') + '</span>';
  }
  function panel(key) {
    if (!side) return;
    var p = key === '_vacia' ? PANEL_VACIA : (PANEL[sector] || {})[key];
    if (!p || sector + key === sideKey) return;
    sideKey = sector + key;
    var html = '<p class="av-side__label">Detrás de esta pantalla</p><h2 class="av-side__title">' + h(p.t) + '</h2>' +
      '<p class="av-side__lead">' + h(p.lead) + '</p>';
    if (p.flow) {
      html += '<ol class="av-flow">' + p.flow.map(function (f, i) {
        return '<li data-n="' + (i + 1) + '"><span class="av-flow__k">' + h(f[0]) + '</span>' + chips(f[1]) + '<p class="av-flow__t">' + h(f[2]) + '</p></li>';
      }).join('') + '</ol>';
    }
    html += '<p class="av-side__you">' + h(p.tu) + '</p>' +
      '<p class="av-side__foot">Las conexiones las monto yo, con las herramientas que ya tienes. La IA puede ser ChatGPT o Claude.</p>';
    side.classList.add('is-changing');
    setTimeout(function () { side.innerHTML = html; side.classList.remove('is-changing'); }, 160);
  }

  // ---------- inbox state ----------
  var sector = 'autonomos';
  var done = {};
  var toast = '';

  function itemsOf(s) { return SECTORES[s].items; }
  function find(id) { return itemsOf(sector).filter(function (i) { return i.id === id; })[0]; }
  function pending() { return itemsOf(sector).filter(function (i) { return !done[i.id]; }); }

  function bandeja() {
    var S = SECTORES[sector];
    var left = pending().length;
    if (!left) return vacia();
    panel('_inbox');
    var comps = [], ids = [];
    if (toast) { comps = comps.concat(line('toast', 'check', toast)); ids.push('toast'); toast = ''; }
    comps.push(T('h', '**' + S.tema + '.** ' + S.intro));
    comps.push(T('cuenta', left === 1 ? 'Te queda 1 cosa esperando tu sí.' : 'Tienes ' + left + ' cosas esperando tu sí.', 'caption'));
    ids.push('h', 'cuenta');
    itemsOf(sector).forEach(function (it, i) {
      var k = 'it' + i;
      if (done[it.id]) {
        comps = comps.concat(line(k + 'l', 'check', it.head, 'Hecho'));
        comps.push(Card(k, k + 'l'));
      } else {
        comps = comps.concat(line(k + 'l', it.icon, it.head, it.sub + (it.live ? ' · En directo' : '')));
        comps = comps.concat(Btn(k + 'b', 'Abrir', 'abrir', 'default', { item: it.id }));
        comps.push(Row(k + 'r', [k + 'l', k + 'b'], { align: 'center', justify: 'spaceBetween' }));
        comps.push(Card(k, k + 'r'));
      }
      ids.push(k);
    });
    comps.push(Col('root', ids));
    return show(comps);
  }

  function vacia() {
    var S = SECTORES[sector];
    var onSectorPage = !!box.getAttribute('data-sector');
    var comps = flat([
      line('ok', 'check', 'Bandeja vacía', 'Has dicho sí a ' + itemsOf(sector).length + ' cosas sin abrir el correo, la agenda ni la hoja de cálculo.'),
      [Card('card', 'ok'),
       T('p', 'Así es como lo monto: el trabajo repetido lo prepara un asistente conectado a tus herramientas, y a ti solo te llega lo que necesita tu sí. Cada conexión hay que montarla y cuidarla, y por eso empiezo siempre por lo que más tiempo te quita.')],
      Btn('cta', 'Hablemos 20 minutos', 'contacto', 'primary'),
      onSectorPage ? [] : Btn('mas', 'Ver cómo lo hago para ' + S.nombre.toLowerCase(), 'pagina', 'borderless'),
      [Row('btns', onSectorPage ? ['cta'] : ['cta', 'mas'], { align: 'center' }),
       Col('root', ['card', 'p', 'btns'])]
    ]);
    track('vacia');
    panel('_vacia');
    return show(comps);
  }

  // ---------- live step: n8n sends the A2UI screen ----------
  function sendNote(texto) {
    var id = 'av_' + (++n);
    show([T('root', 'Leyendo tu nota…')], { badge: 'live' });
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 30000);
    fetch(LIVE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto: String(texto || '').slice(0, 600), surfaceId: id }),
      signal: ctrl ? ctrl.signal : undefined
    })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (data) {
        clearTimeout(timer);
        var msgs = (data && data.messages) || [];
        // Only accept the screen for the surface we asked for, and only the
        // message types this page needs.
        var safe = msgs.filter(function (m) {
          var body = m.createSurface || m.updateComponents || m.updateDataModel;
          return m.version === '1.0' && body && body.surfaceId === id &&
            !m.deleteSurface && !m.callRendererFunction;
        });
        if (!safe.length || !safe[0].createSurface) throw new Error('empty');
        safe[0].createSurface.catalogId = CATALOG;
        safe.forEach(function (m) { if (m.updateComponents) m.updateComponents.components = fixIds(m.updateComponents.components || []); });
        n = Math.max(n, parseInt(id.slice(3), 10));
        pendingMeta[id] = { badge: 'live' };
        processor.processMessages(safe);
        track('notas-directo');
      })
      .catch(function () {
        clearTimeout(timer);
        fallback();
      });
  }

  function fallback() {
    show(flat([
      [T('h', 'La parte en directo no responde ahora mismo. Te enseño lo que suele salir con la nota de ejemplo:')],
      line('i1', 'check', 'Llamar a Marta por el logotipo', 'Tarea · mañana'),
      line('i2', 'shoppingCart', 'Comprar tinta para la impresora', 'Lista de compra'),
      line('i3', 'mail', 'Enviar a Jordi las fotos del proyecto', 'Borrador de email · antes del viernes'),
      line('i4', 'event', 'Cita con la gestora', 'Calendario · martes a las diez'),
      [Card('c1', 'i1'), Card('c2', 'i2'), Card('c3', 'i3'), Card('c4', 'i4')],
      Btn('ok', 'Bien, así lo quiero', 'notas-aprobar', 'primary'),
      Btn('later', 'Ahora no', 'bandeja', 'borderless'),
      [Row('btns', ['ok', 'later'], { align: 'center' }),
       Col('root', ['h', 'c1', 'c2', 'c3', 'c4', 'btns'])]
    ]));
    track('notas-fallo');
  }

  // ---------- what each button does ----------
  function approve(id) {
    var it = find(id);
    if (!it) return bandeja();
    done[id] = true;
    toast = it.hecho;
    track('aprobar-' + id);
    bandeja();
  }

  function onAction(a) {
    var ctx = a.context || {};
    switch (a.name) {
      case 'abrir': { var it = find(ctx.item); if (it) { panel(it.id); it.open(); track('abrir-' + it.id); } return; }
      case 'aprobar': return approve(ctx.item);
      case 'bandeja': return bandeja();
      case 'notas-aprobar': return approve('notas');
      case 'escena-notas': return find('notas').open();
      case 'notas-enviar': {
        var txt = String(ctx.texto || '').trim();
        if (txt.length < 12) {
          show(flat([[T('h', 'Escribe un poco más: una nota de voz suele tener dos o tres cosas mezcladas.')],
            Btn('r', 'Volver a intentarlo', 'escena-notas', 'borderless'), [Col('root', ['h', 'r'])]]), { badge: 'live' });
          return;
        }
        return sendNote(txt);
      }
      case 'contacto':
        try { if (window.umami) window.umami.track('click-contacto', { location: 'aventura-' + sector }); } catch (e) {}
        window.location.href = '/#reserva';
        return;
      case 'pagina':
        window.location.href = SECTORES[sector].pagina;
        return;
    }
  }

  // ---------- switching sector and starting over ----------
  var tabs = document.querySelectorAll('[data-av-sector]');
  function start(s) {
    if (!SECTORES[s]) s = 'autonomos';
    sector = s;
    done = {};
    toast = '';
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].setAttribute('aria-pressed', tabs[i].getAttribute('data-av-sector') === s ? 'true' : 'false');
    }
    if (title) title.textContent = SECTORES[s].tema;
    var clock = document.getElementById('av-clock');
    if (clock) clock.textContent = SECTORES[s].dia;
    bandeja();
  }
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener('click', function () { start(this.getAttribute('data-av-sector')); track('sector'); });
  }
  if (restart) restart.addEventListener('click', function () { start(sector); track('empezar'); });

  var fromUrl = (location.search.match(/[?&]sector=([a-z]+)/) || [])[1];
  start(box.getAttribute('data-sector') || fromUrl || 'autonomos');
})();
