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

  // Every item screen ends the same way: say yes, or leave it for later.
  function decide(item, yesLabel, ctx) {
    return flat([
      Btn('yes', yesLabel, 'aprobar', 'primary', Object.assign({ item: item }, ctx || {})),
      Btn('later', 'Ahora no', 'bandeja', 'borderless'),
      [Row('decide', ['yes', 'later'], { align: 'center' })]
    ]);
  }

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
              Btn('go', 'Ordénalo', 'notas-enviar', 'primary', { texto: { '@path': '/texto' } }),
              Btn('later', 'Ahora no', 'bandeja', 'borderless'),
              [Row('btns', ['go', 'later'], { align: 'center' }),
               Col('root', ['h', 'texto', 'btns', 'priv'])]
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
              [T('h', 'El informe se ha montado solo con los datos del mes. Datos de ejemplo:')],
              table('web', [['Visitas', '4.180'], ['Contactos desde la web', '37'], ['Página más vista', 'Ofertas de temporada']]),
              table('redes', [['Publicaciones', '12'], ['Interacciones', '1.240'], ['Mejor post', 'Detrás del mostrador']]),
              table('ads', [['Inversión', '600 €'], ['Clics', '910'], ['Coste por contacto', '16 €']]),
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
          hecho: 'Texto guardado como borrador en el portal, listo para publicar.',
          open: function () {
            return show(flat([
              [T('h', 'Tus notas: **3 hab., 2 baños, reformado, mucha luz, balcón, cerca del metro, 4.º con ascensor.**'),
               T('p', 'El texto del anuncio, preparado. Cámbialo si quieres:')],
              draft('borrador', 'Texto del anuncio'),
              decide('anuncio', 'Guardar en el portal'),
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
      case 'abrir': { var it = find(ctx.item); if (it) { it.open(); track('abrir-' + it.id); } return; }
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
