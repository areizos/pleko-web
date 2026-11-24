/*
  pleko.es: "Tu lunes" A2UI adventure (hidden test page, Spanish).

  How it works, in plain words:
  - Every screen in the chat is an A2UI message: a JSON description of
    buttons, cards and forms. The A2UI renderer (a2ui.js, by Google, Apache 2.0)
    draws them. Nothing here is hand-built HTML.
  - Most screens come from the small script below ("Simulación").
  - The voice-note step is live ("En directo"): the text goes to Alex's n8n,
    an AI splits it into actions, and n8n sends back the A2UI screen.
*/
(function () {
  'use strict';

  var LIVE_URL = 'https://n8n-t5ly.srv2030958.hstgr.cloud/webhook/pleko-aventura-notas';
  var CATALOG = 'https://a2ui.org/specification/v1_0/catalogs/basic/catalog.json';
  var A = window.PlekoA2UI;
  var chat = document.getElementById('av-chat');
  if (!A || !chat) return;

  A.injectBasicCatalogStyles(document);

  var n = 0;
  var pendingMeta = {};
  var processor = new A.MessageProcessor([A.basicCatalog], onAction);

  processor.onSurfaceCreated(function (surface) {
    var meta = pendingMeta[surface.id] || { badge: 'sim' };
    var turn = document.createElement('div');
    turn.className = 'av-turn av-turn--agent';
    turn.innerHTML =
      '<div class="av-meta"><span class="av-who">Asistente</span>' +
      (meta.badge === 'live'
        ? '<span class="demo__badge demo__badge--live">En directo</span>'
        : '<span class="demo__badge demo__badge--sim">Simulación</span>') +
      '</div>';
    var el = document.createElement('a2ui-surface');
    el.surface = surface;
    turn.appendChild(el);
    retirePrevious();
    chat.appendChild(turn);
    setTimeout(function () { turn.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60);
  });

  function retirePrevious() {
    var turns = chat.querySelectorAll('.av-turn--agent:not(.av-turn--past)');
    for (var i = 0; i < turns.length; i++) {
      turns[i].classList.add('av-turn--past');
      turns[i].setAttribute('inert', '');
    }
  }

  function youSaid(text) {
    if (!text) return;
    var p = document.createElement('div');
    p.className = 'av-turn av-turn--you';
    p.innerHTML = '<span class="av-who">Tú</span>';
    var t = document.createElement('p');
    t.textContent = text;
    p.appendChild(t);
    chat.appendChild(p);
  }

  function track(escena) {
    try { if (window.umami) window.umami.track('aventura', { escena: escena }); } catch (e) {}
  }

  // ---------- tiny helpers to write A2UI components ----------
  function T(id, text, variant) { var c = { id: id, component: 'Text', text: text }; if (variant) c.variant = variant; return c; }
  function Btn(id, label, action, variant, context) {
    return [
      T(id + '-t', label),
      { id: id, component: 'Button', child: id + '-t', variant: variant || 'default',
        action: { event: { name: action, context: Object.assign({ eco: label }, context || {}) } } }
    ];
  }
  function Ico(id, name) { return { id: id, component: 'Icon', name: name }; }
  function Col(id, kids, extra) { return Object.assign({ id: id, component: 'Column', children: kids }, extra || {}); }
  function Row(id, kids, extra) { return Object.assign({ id: id, component: 'Row', children: kids }, extra || {}); }
  function flat(list) { return [].concat.apply([], list); }

  // A row with an icon, a bold line and a grey line (used for steps and choices).
  function line(id, icon, title, sub) {
    var kids = [id + '-a'];
    var out = [Ico(id + '-i', icon), T(id + '-a', '**' + title + '**')];
    if (sub) { kids.push(id + '-b'); out.push(T(id + '-b', sub, 'caption')); }
    out.push(Col(id + '-c', kids, { weight: 1 }));
    out.push(Row(id, [id + '-i', id + '-c'], { align: 'center' }));
    return out;
  }

  // Icons drawn as SVG paths (24x24, Material Design shapes, Apache 2.0), so the
  // page doesn't need Google's icon font: pleko.es loads no third-party fonts.
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
    shoppingCart: 'M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0020 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z'
  };

  // A2UI ids must be plain identifiers (letters, digits, underscores).
  function fixId(x) { return typeof x === 'string' ? x.replace(/[^A-Za-z0-9_]/g, '_') : x; }
  function fixIds(components) {
    return components.map(function (c) {
      var o = Object.assign({}, c, { id: fixId(c.id) });
      if (o.child) o.child = fixId(o.child);
      if (Array.isArray(o.children)) o.children = o.children.map(fixId);
      if (o.component === 'Icon' && typeof o.name === 'string') o.name = { svgPath: ICONS[o.name] || ICONS.check };
      return o;
    });
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

  var FOOT = function (p) {
    return flat([
      Btn(p + 'v', 'Volver al lunes', 'inicio', 'borderless'),
      Btn(p + 'h', 'Quiero algo así', 'contacto', 'default'),
      [Row(p, [p + 'v', p + 'h'], { justify: 'spaceBetween', align: 'center' })]
    ]);
  };

  // ---------- the story ----------
  var ESCENAS = {
    inicio: function () {
      function opcion(k, icon, title, sub, label, action) {
        return flat([
          line(k + 'l', icon, title, sub),
          Btn(k + 'b', label, action, 'primary'),
          [Col(k + 'c', [k + 'l', k + 'b']), { id: k, component: 'Card', child: k + 'c' }]
        ]);
      }
      return show(flat([
        [T('h', '**Lunes, 9:14.** Abres el móvil y ya hay tres cosas esperándote. ¿Por cuál empiezas?')],
        opcion('o1', 'event', 'Un cliente pide mesa para 4 el viernes', 'Te ha escrito por WhatsApp hace 5 minutos', 'Contestar al cliente', 'escena-mesa'),
        opcion('o2', 'edit', 'Tus notas de voz del coche', 'Tres cosas mezcladas en un audio de un minuto', 'Ordenar mis notas', 'escena-notas'),
        opcion('o3', 'photo', 'Una factura de papel encima de la mesa', 'Hay que pasarla a la hoja de gastos', 'Pasar la factura', 'escena-factura'),
        [T('nota', 'En cada pantalla verás si es una simulación o si funciona en directo.', 'caption'),
         Col('root', ['h', 'o1', 'o2', 'o3', 'nota'])]
      ]));
    },

    // 1 · Reservation assistant (simulation)
    'escena-mesa': function () {
      return show(flat([
        [T('h', 'Laura te escribe: **«¡Hola! ¿Tenéis mesa para 4 este viernes por la noche?»**'),
         T('p', 'Antes de contestar, el asistente mira tu agenda de reservas. Estos son los huecos libres del viernes:'),
         { id: 'hora', component: 'ChoicePicker', label: 'Elige la hora que le ofreces', variant: 'mutuallyExclusive', displayStyle: 'chips',
           options: [{ label: '20:30', value: '20:30' }, { label: '21:00', value: '21:00' }, { label: '22:15', value: '22:15' }],
           value: { '@path': '/hora' } },
         T('lleno', 'Las 21:30 están completas, así que ni las ofrece.', 'caption')],
        Btn('ok', 'Confirmar a Laura', 'mesa-confirmada', 'primary', { hora: { '@path': '/hora' } }),
        Btn('grupo', '¿Y si fueran 12 personas?', 'mesa-grupo', 'borderless'),
        [Row('btns', ['ok', 'grupo'], { align: 'center' }),
         Col('root', ['h', 'p', 'hora', 'lleno', 'btns'])]
      ]), { data: { hora: ['21:00'] } });
    },

    'mesa-confirmada': function (ctx) {
    var hora = (ctx && ctx.hora && ctx.hora[0]) || '21:00';
    return show(flat([
      line('res', 'check', 'Reserva confirmada', 'Viernes · ' + hora + ' · 4 personas · Laura'),
      [{ id: 'card', component: 'Card', child: 'res' },
       T('p', 'Esto es lo que ha pasado en dos segundos:')],
      line('s1', 'search', 'Ha leído el mensaje', 'Ha entendido el día, la hora y cuántas personas'),
      line('s2', 'calendarToday', 'Ha mirado tu agenda', 'Solo ha ofrecido huecos libres'),
      line('s3', 'edit', 'Ha apuntado la reserva', 'En la misma hoja que usas cada día'),
      line('s4', 'send', 'Ha contestado a Laura', 'Con la hora y un recordatorio para el viernes'),
      [Col('pasos', ['s1', 's2', 's3', 's4']),
       T('tu', 'Tú no has tocado el móvil. Si algo no encaja, te lo pasa a ti.', 'caption')],
      FOOT('f'),
      [Col('root', ['card', 'p', 'pasos', 'tu', 'f'])]
    ]));
    },

    'mesa-grupo': function () {
      return show(flat([
        line('av', 'notifications', 'Aviso para ti', 'Laura pide mesa para 12 el viernes a las 21:00. ¿Le dices que sí?'),
        [{ id: 'card', component: 'Card', child: 'av' },
         T('p', 'Para grupos grandes, el asistente no decide solo. Te avisa con todo apuntado y tú contestas con un toque.'),
         T('ag', 'Eso es un **agente**: decide qué herramienta usar con lo que le llega (tu agenda, tu hoja, WhatsApp), pero las decisiones importantes son tuyas.', 'caption')],
        Btn('si', 'Sí, confírmalo', 'mesa-confirmada', 'primary', { hora: ['21:00'] }),
        FOOT('f'),
        [Col('root', ['card', 'p', 'ag', 'si', 'f'])]
      ]));
    },

    // 2 · Voice-note pipeline (live through n8n)
    'escena-notas': function () {
      return show(flat([
        [T('h', 'Vas en el coche y dictas lo que se te pasa por la cabeza. Escríbelo aquí como si lo dijeras en voz alta, o deja el ejemplo.'),
         { id: 'texto', component: 'TextField', label: 'Tu nota de voz (en texto)', variant: 'longText', value: { '@path': '/texto' } },
         T('priv', 'El texto pasa por mi servidor de automatizaciones y por un modelo de IA de OpenAI para leerlo. Yo no lo guardo. No escribas datos personales reales.', 'caption')],
        Btn('go', 'Ordénalo', 'notas-enviar', 'primary', { texto: { '@path': '/texto' } }),
        Btn('v', 'Volver al lunes', 'inicio', 'borderless'),
        [Row('btns', ['go', 'v'], { align: 'center' }),
         Col('root', ['h', 'texto', 'btns', 'priv'])]
      ]), { badge: 'live', data: { texto: 'Vale, a ver: mañana llamar a Marta por lo del presupuesto, comprar tinta para la impresora, mandarle a Jordi las fotos del local antes del viernes y pedir cita con la gestora el martes a las diez.' } });
    },

    'notas-aprobar': function () {
      return show(flat([
        [T('h', '**Hecho.** En la versión real, cada tarjeta acaba en su sitio: las tareas en tu Notion, las citas en tu calendario y los emails como borradores en tu Gmail, listos para que los revises.'),
         T('p', 'Tú hablas al móvil. Lo demás se ordena solo, y nada sale sin que lo mires.', 'caption')],
        FOOT('f'),
        [Col('root', ['h', 'p', 'f'])]
      ]));
    },

    // 3 · Invoice reading (simulation)
    'escena-factura': function () {
      return show(flat([
        [{ id: 'img', component: 'Image', url: '/pruebalo/aventura/factura-ejemplo.svg', description: 'Factura de ejemplo de un proveedor ficticio', variant: 'mediumFeature', fit: 'contain' },
         T('p', 'Lo normal: abrir la hoja de gastos y teclear proveedor, fecha, base, IVA y total. Y equivocarte en un número.')],
        Btn('go', 'Léela por mí', 'factura-leida', 'primary'),
        Btn('v', 'Volver al lunes', 'inicio', 'borderless'),
        [Row('btns', ['go', 'v'], { align: 'center' }),
         Col('root', ['img', 'p', 'btns'])]
      ]));
    },

    'factura-leida': function () {
      var campos = [
        ['Proveedor', 'Suministros Ejemplo S.L.'], ['NIF', 'B00000000'], ['Fecha', '18/11/2026'],
        ['Concepto', 'Material de oficina'], ['Base', '120,00 €'], ['IVA (21 %)', '25,20 €'], ['Total', '**145,20 €**']
      ];
      var comps = [];
      var ids = [];
      campos.forEach(function (c, i) {
        comps.push(T('k' + i, c[0], 'caption'), T('v' + i, c[1]),
          Row('r' + i, ['k' + i, 'v' + i], { justify: 'spaceBetween', align: 'center' }));
        ids.push('r' + i);
      });
      return show(flat([
        comps,
        [Col('datos', ids), { id: 'card', component: 'Card', child: 'datos' },
         T('h', 'La IA ha leído la foto y ha sacado los datos. Antes de guardar nada, lo revisas tú:')],
        Btn('ok', 'Todo correcto, guárdala', 'factura-ok', 'primary'),
        Btn('mal', 'Hay un error', 'factura-error', 'borderless'),
        [Row('btns', ['ok', 'mal'], { align: 'center' }),
         Col('root', ['h', 'card', 'btns'])]
      ]));
    },

    'factura-error': function () {
      return show(flat([
        [T('h', 'Bien visto. Por eso siempre la revisa una persona antes de guardarla: la IA lee muy bien, pero no es infalible. Corriges el dato y listo.')],
        Btn('ok', 'Guardar corregida', 'factura-ok', 'primary'),
        [Col('root', ['h', 'ok'])]
      ]));
    },

    'factura-ok': function () {
      return show(flat([
        line('res', 'check', 'Guardada en tu hoja de gastos', 'Con la foto adjunta y el total en su columna'),
        [{ id: 'card', component: 'Card', child: 'res' },
         T('p', 'Si este proveedor te manda la factura por email cada mes, la próxima puede entrar sola desde tu correo. Tú solo miras y dices sí.'),
         T('c', 'Nadie ha tecleado nada.', 'caption')],
        FOOT('f'),
        [Col('root', ['card', 'p', 'c', 'f'])]
      ]));
    }
  };

  // ---------- live step: n8n sends the A2UI screen ----------
  function sendNote(texto) {
    var id = 'av_' + (++n);
    var wait = show([T('root', 'Leyendo tu nota…')], { badge: 'live' });
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
        // three message types this page needs.
        var safe = msgs.filter(function (m) {
          var body = m.createSurface || m.updateComponents || m.updateDataModel;
          return m.version === '1.0' && body && body.surfaceId === id &&
            !m.deleteSurface && !m.callRendererFunction;
        });
        if (!safe.length || !safe[0].createSurface) throw new Error('empty');
        safe[0].createSurface.catalogId = CATALOG;
        safe.forEach(function (m) { if (m.updateComponents) m.updateComponents.components = fixIds(m.updateComponents.components || []); });
        pendingMeta[id] = { badge: 'live' };
        processor.processMessages(safe);
        track('notas-directo');
      })
      .catch(function () {
        clearTimeout(timer);
        fallback();
      });
    return wait;
  }

  function fallback() {
    show(flat([
      [T('h', 'La parte en directo no responde ahora mismo. Te enseño lo que suele salir con la nota de ejemplo:')],
      line('i1', 'check', 'Llamar a Marta por el presupuesto', 'Tarea · mañana'),
      line('i2', 'shoppingCart', 'Comprar tinta para la impresora', 'Lista de compra'),
      line('i3', 'mail', 'Enviar a Jordi las fotos del local', 'Borrador de email · antes del viernes'),
      line('i4', 'event', 'Cita con la gestora', 'Calendario · martes a las diez'),
      [{ id: 'c1', component: 'Card', child: 'i1' }, { id: 'c2', component: 'Card', child: 'i2' },
       { id: 'c3', component: 'Card', child: 'i3' }, { id: 'c4', component: 'Card', child: 'i4' }],
      Btn('ok', 'Bien, así lo quiero', 'notas-aprobar', 'primary'),
      Btn('otra', 'Probar otra vez', 'escena-notas', 'borderless'),
      [Row('btns', ['ok', 'otra'], { align: 'center' }),
       Col('root', ['h', 'c1', 'c2', 'c3', 'c4', 'btns'])]
    ]));
    track('notas-fallo');
  }

  // ---------- what each button does ----------
  function onAction(a) {
    var ctx = a.context || {};
    youSaid(ctx.eco);
    if (a.name === 'contacto') {
      try { if (window.umami) window.umami.track('click-contacto', { location: 'aventura' }); } catch (e) {}
      window.location.href = '/#reserva';
      return;
    }
    if (a.name === 'notas-enviar') {
      var txt = String(ctx.texto || '').trim();
      if (txt.length < 12) {
        show(flat([[T('h', 'Escribe un poco más: una nota de voz suele tener dos o tres cosas mezcladas.')],
          Btn('r', 'Volver a intentarlo', 'escena-notas', 'borderless'), [Col('root', ['h', 'r'])]]), { badge: 'live' });
        return;
      }
      sendNote(txt);
      return;
    }
    var go = ESCENAS[a.name];
    if (go) { go(ctx); track(a.name); }
  }

  var start = document.getElementById('av-start');
  if (start) start.remove();
  ESCENAS.inicio();
})();
