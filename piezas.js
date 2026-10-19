/* =========================================================================
   pleko · "Conecta las piezas" demo on /pruebalo/ and /en/try-it/
   A simulation (the page labels it so): the visitor picks four pieces, lines
   join them, a dot travels the flow and the result appears in a mock-up of
   the destination app. Pieces that don't fit the earlier choices are greyed
   out. All text and example data for both languages live in D below.
   Nothing is sent anywhere.
   ========================================================================= */
(function () {
  'use strict';

  var root = document.getElementById('demo-piezas-app');
  if (!root) return;

  var lang = document.documentElement.lang === 'en' ? 'en' : 'es';
  var other = lang === 'en' ? 'es' : 'en';
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var WHATSAPP = '34656310631';

  /* ---------- Which piece fits after which --------------------------------
     Language-free. A voice note can only be transcribed first; a photo of an
     invoice can be sorted or read but not answered; replies go back through
     the channel they came from; extras depend on where the result lands. */
  var TEXT = ['form', 'email', 'whatsapp'];
  var fits = {
    ai: function (s, id) {
      if (s.trigger === 'voice') return id === 'transcribe';
      if (s.trigger === 'photo') return id === 'classify' || id === 'extract';
      return id !== 'transcribe';
    },
    dest: function (s, id) {
      var photo = s.trigger === 'photo';
      switch (s.ai) {
        case 'classify': return photo ? id === 'sheet' : ['sheet', 'crm', 'email'].indexOf(id) > -1;
        case 'extract': return photo ? id === 'sheet' : ['calendar', 'sheet', 'crm', 'invoice'].indexOf(id) > -1;
        case 'transcribe': return ['calendar', 'sheet', 'crm'].indexOf(id) > -1;
        case 'reply':
        case 'translate': return id === (s.trigger === 'whatsapp' ? 'whatsapp' : 'email');
      }
      return false;
    },
    extra: function (s, id) {
      var ok = {
        calendar: ['alert', 'reminder', 'none'],
        invoice: ['review', 'reminder', 'alert', 'none'],
        crm: ['alert', 'reminder', 'none'],
        sheet: ['alert', 'none'],
        email: ['review', 'alert', 'none'],
        whatsapp: ['review', 'alert', 'none']
      }[s.dest] || [];
      return ok.indexOf(id) > -1;
    }
  };
  var STEPS = ['trigger', 'ai', 'dest', 'extra'];
  // Rough minutes it takes by hand, for the "a mano" line under the result.
  var MINUTES = { calendar: 5, sheet: 4, crm: 6, invoice: 10, email: 6, whatsapp: 4, transcribe: 3, translate: 5, reminder: 3, alert: 1, review: 0, none: 0 };

  /* ---------- Icons (24px line icons, drawn like the rest of the site) --- */
  var I = {
    form: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    email: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    whatsapp: '<path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/><path d="M9 10c0 2.5 2.5 5 5 5"/>',
    voice: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    photo: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    classify: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>',
    extract: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 10v10"/>',
    transcribe: '<path d="M4 9v6M8 6v12M12 9v6"/><path d="M15 9h6M15 13h6M15 17h4"/>',
    reply: '<path d="M10 7 4 12l6 5"/><path d="M4 12h10a6 6 0 0 1 6 6"/>',
    translate: '<path d="M4 6h9M8.5 4v2M6 6c0 4 3 7 6 8M11 6c0 3-3 7-7 8"/><path d="m13 20 4-9 4 9M14.5 17h5"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><rect x="7" y="13" width="4" height="4" rx="1"/>',
    sheet: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M3 14h18M9 4v16M15 4v16"/>',
    crm: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="11" r="2.5"/><path d="M5.5 17c.6-2 2-3 3.5-3s2.9 1 3.5 3M15 10h3M15 14h3"/>',
    invoice: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    alert: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    reminder: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M5 4 3 6M19 4l2 2"/>',
    review: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    none: '<circle cx="12" cy="12" r="8"/><path d="M8.5 12h7"/>'
  };
  function icon(id) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + I[id] + '</svg>'; }

  /* ---------- Text and example data --------------------------------------
     Each business gives the example its names, dates and amounts. The other
     language's data is used when the visitor picks "translate". */
  var D = {
    es: {
      cols: ['1 · Cuando llega…', '2 · La IA…', '3 · Y lo lleva a…', '4 · Y además…'],
      pieces: {
        trigger: { form: 'Un formulario web', email: 'Un correo', whatsapp: 'Un WhatsApp', voice: 'Una nota de voz', photo: 'La foto de una factura' },
        ai: { classify: 'Lo clasifica', extract: 'Saca los datos', transcribe: 'Lo transcribe', reply: 'Prepara la respuesta', translate: 'Lo traduce' },
        dest: { calendar: 'Tu calendario', sheet: 'Tu hoja de cálculo', crm: 'Tu CRM', invoice: 'Una factura', email: 'Un correo', whatsapp: 'Un WhatsApp' },
        extra: { alert: 'Te avisa al móvil', reminder: 'Recordatorio al cliente', review: 'Lo revisas tú antes', none: 'Nada más' }
      },
      bizLabel: 'Tu negocio:',
      run: 'Ponerlo en marcha', surprise: 'Sorpréndeme', again: 'Probar otra',
      pick: 'Elige una pieza de cada columna.', ready: 'Listo. Pulsa «Ponerlo en marcha».',
      running: 'En marcha…', done: 'Hecho, sin que nadie copie y pegue nada.',
      nofit: 'No encaja con lo que has elegido antes',
      manual: function (m) { return '<strong>A mano:</strong> unos ' + m + ' minutos · <strong>Automático:</strong> unos segundos'; },
      cta: '¿Montamos esta en tu negocio?',
      wa: function (flow) { return 'Hola Alex, he probado «Conecta las piezas» en pleko.es: ' + flow + '. ¿Lo vemos para mi negocio?'; },
      biz: {
        peluqueria: { label: 'Peluquería', name: 'Peluquería Tijeras', client: 'Marta', item: 'corte y color', whenText: 'el jueves a las 10', day: 'Jueves', time: '10:00', amount: '45,00 €', supplier: 'Cosmética Mar', total: '96,80 €', iva: '16,80 €', cat: 'productos de peluquería' },
        panaderia: { label: 'Panadería', name: 'Forn de la Plaça', client: 'Jordi', item: 'un pastel de cumpleaños para 12', whenText: 'para el sábado a las 11', day: 'Sábado', time: '11:00', amount: '32,00 €', supplier: 'Harinas del Vallès', total: '182,60 €', iva: '7,02 €', cat: 'materia prima' },
        discos: { label: 'Tienda de discos', name: 'Vinilos Raval', client: 'Nil', item: 'el vinilo de «Kind of Blue»', whenText: 'para recogerlo el viernes a las 6', day: 'Viernes', time: '18:00', amount: '29,90 €', supplier: 'Distribuidora Surco', total: '340,00 €', iva: '59,01 €', cat: 'compra de stock' },
        autonomo: { label: 'Autónomo', name: 'Estudio Laia', client: 'Pau', item: 'una llamada para un presupuesto de web', whenText: 'el martes a las 16:30', day: 'Martes', time: '16:30', amount: '850,00 €', supplier: 'Papelería Sol', total: '48,40 €', iva: '8,40 €', cat: 'material de oficina' }
      },
      langName: 'español', otherLang: 'inglés', q: ['«', '»'],
      channel: { form: 'Formulario web', email: 'Correo', whatsapp: 'WhatsApp', voice: 'Nota de voz', photo: 'Foto' },
      ask: function (b) { return 'Hola, ¿podría ser ' + b.item + ' ' + b.whenText + '? Gracias, ' + b.client; },
      answer: function (b) { return '¡Hola ' + b.client + '! Sí, ' + b.day.toLowerCase() + ' a las ' + b.time + ' nos va perfecto. ¿Te lo confirmo?'; },
      line: {
        trigger: {
          form: function (b) { return '<b>Formulario web</b> de ' + b.client; },
          email: function (b) { return '<b>Correo</b> de ' + b.client; },
          whatsapp: function (b) { return '<b>WhatsApp</b> de ' + b.client; },
          voice: function (b) { return '<b>Nota de voz</b> de ' + b.client + ' · ▶ 0:14'; },
          photo: function (b) { return '<b>Foto</b> de una factura de ' + b.supplier + ', hecha con el móvil'; }
        },
        foreignIn: function (n) { return ', en ' + n; },
        ai: {
          classify: function (b, photo) { return '<b>La IA lo clasifica:</b> ' + (photo ? 'factura de proveedor · ' + b.cat : 'petición de cliente · prioridad alta'); },
          extract: function (b, photo) { return '<b>Saca los datos:</b> ' + (photo ? b.supplier + ' · 14/10 · total ' + b.total + ' · IVA ' + b.iva : b.client + ' · ' + b.item + ' · ' + b.day.toLowerCase() + ', ' + b.time); },
          transcribe: function (b) { return '<b>Lo transcribe:</b> «Hola, soy ' + b.client + ', quería ' + b.item + ' ' + b.whenText + '.»'; },
          reply: function (b) { return '<b>Prepara la respuesta</b> con tus horarios libres.'; },
          translate: function (b, photo, n) { return '<b>Lo traduce</b> al español y prepara la respuesta en ' + n + '.'; }
        },
        dest: {
          calendar: function (b) { return '<b>Cita creada</b> en tu calendario.'; },
          sheet: function () { return '<b>Fila nueva</b> en tu hoja de cálculo.'; },
          crm: function (b) { return '<b>Ficha nueva</b> de ' + b.client + ' en tu CRM.'; },
          invoice: function (b) { return '<b>Factura creada</b> por ' + b.amount + '.'; },
          email: function (b, s) { return s.ai === 'classify' ? '<b>Reenviado</b> a quien lo lleva, con su etiqueta.' : '<b>Respuesta enviada</b> por correo.'; },
          whatsapp: function () { return '<b>Respuesta enviada</b> por WhatsApp.'; }
        },
        extra: {
          alert: function () { return '<b>Te llega un aviso</b> al móvil.'; },
          reminder: function (b, s) { return { calendar: '<b>Recordatorio</b> al cliente el día antes.', invoice: '<b>Recordatorio de pago</b> si no se paga en 15 días.', crm: '<b>Seguimiento</b> automático en 3 días si no responde.' }[s.dest]; },
          review: function () { return '<b>Espera tu OK</b> antes de salir.'; },
          none: function () { return ''; }
        }
      },
      mock: {
        calTitle: 'Calendario', sheetCols: ['Fecha', 'Cliente', 'Pide', 'Cuándo', 'Canal'], sheetColsPhoto: ['Fecha', 'Proveedor', 'Concepto', 'Total', 'IVA'],
        sheetColsClass: ['Fecha', 'Cliente', 'Tipo', 'Prioridad', 'Canal'], typeReq: 'Petición', high: 'Alta',
        crmStage: 'Etapa', crmNew: 'Nuevo contacto', crmInterest: 'Interés', crmSource: 'Origen', crmTask: 'Tarea', crmTaskText: 'Llamar mañana',
        crmTag: 'prioridad alta',
        invNo: 'Factura nº 2026-041', invTo: 'Cliente', invTotal: 'Total (IVA incl.)',
        mailTo: 'Para', mailSubj: 'Asunto', fwdSubj: '[Petición] ', fwdBody: 'Reenviado automáticamente a la persona que lo lleva.', team: 'pedidos',
        review: 'Esperando tu OK', approve: 'Aprobar', edit: 'Editar', sent: 'Aprobado y enviado ✓', editing: 'Abrirías el borrador para cambiarlo.',
        phone: 'Ahora', notif: {
          calendar: function (b) { return 'Nueva cita: ' + b.client + ', ' + b.day.toLowerCase() + ' ' + b.time; },
          sheet: function () { return 'Fila nueva en tu hoja'; },
          crm: function (b) { return 'Contacto nuevo: ' + b.client; },
          invoice: function (b) { return 'Factura creada: ' + b.amount; },
          email: function (b) { return 'Respondido: ' + b.client; },
          whatsapp: function (b) { return 'Respondido: ' + b.client; }
        },
        remind: {
          calendar: function (b) { return 'Hola ' + b.client + ' 👋 Te recuerdo: mañana a las ' + b.time + ', ' + b.item + '. ¿Confirmas? Responde SÍ o CAMBIAR.'; },
          invoice: function (b) { return 'Hola ' + b.client + ', te recordamos amablemente la factura 2026-041 (' + b.amount + '). ¡Gracias!'; },
          crm: function (b) { return 'Hola ' + b.client + ', ¿pudiste ver lo que te mandé? Si te va bien, lo hablamos esta semana.'; }
        }
      }
    },
    en: {
      cols: ['1 · When this comes in…', '2 · The AI…', '3 · And takes it to…', '4 · And also…'],
      pieces: {
        trigger: { form: 'A web form', email: 'An email', whatsapp: 'A WhatsApp', voice: 'A voice note', photo: 'A photo of an invoice' },
        ai: { classify: 'Sorts it', extract: 'Pulls out the data', transcribe: 'Transcribes it', reply: 'Drafts the reply', translate: 'Translates it' },
        dest: { calendar: 'Your calendar', sheet: 'Your spreadsheet', crm: 'Your CRM', invoice: 'An invoice', email: 'An email', whatsapp: 'A WhatsApp' },
        extra: { alert: 'Pings your phone', reminder: 'Reminds the client', review: 'You check it first', none: 'Nothing else' }
      },
      bizLabel: 'Your business:',
      run: 'Run it', surprise: 'Surprise me', again: 'Try another',
      pick: 'Pick one piece from each column.', ready: 'Ready. Press “Run it”.',
      running: 'Running…', done: 'Done, without anyone copying and pasting.',
      nofit: "Doesn't fit what you picked before",
      manual: function (m) { return '<strong>By hand:</strong> about ' + m + ' minutes · <strong>Automated:</strong> a few seconds'; },
      cta: 'Shall we set this up for your business?',
      wa: function (flow) { return 'Hi Alex, I tried “Connect the pieces” on pleko.es: ' + flow + '. Could we look at this for my business?'; },
      biz: {
        peluqueria: { label: 'Hair salon', name: 'Peluquería Tijeras', client: 'Marta', item: 'a cut and colour', whenText: 'on Thursday at 10', day: 'Thursday', time: '10:00', amount: '€45.00', supplier: 'Cosmética Mar', total: '€96.80', iva: '€16.80', cat: 'salon products' },
        panaderia: { label: 'Bakery', name: 'Forn de la Plaça', client: 'Jordi', item: 'a birthday cake for 12', whenText: 'for Saturday at 11', day: 'Saturday', time: '11:00', amount: '€32.00', supplier: 'Harinas del Vallès', total: '€182.60', iva: '€7.02', cat: 'ingredients' },
        discos: { label: 'Record shop', name: 'Vinilos Raval', client: 'Nil', item: 'the «Kind of Blue» vinyl', whenText: 'to pick up on Friday at 6', day: 'Friday', time: '18:00', amount: '€29.90', supplier: 'Distribuidora Surco', total: '€340.00', iva: '€59.01', cat: 'stock purchase' },
        autonomo: { label: 'Freelancer', name: 'Estudio Laia', client: 'Pau', item: 'a call about a website quote', whenText: 'on Tuesday at 16:30', day: 'Tuesday', time: '16:30', amount: '€850.00', supplier: 'Papelería Sol', total: '€48.40', iva: '€8.40', cat: 'office supplies' }
      },
      langName: 'English', otherLang: 'Spanish', q: ['“', '”'],
      channel: { form: 'Web form', email: 'Email', whatsapp: 'WhatsApp', voice: 'Voice note', photo: 'Photo' },
      ask: function (b) { return 'Hi, could I book ' + b.item + ' ' + b.whenText + '? Thanks, ' + b.client; },
      answer: function (b) { return 'Hi ' + b.client + '! Yes, ' + b.day + ' at ' + b.time + ' works perfectly. Shall I confirm it?'; },
      line: {
        trigger: {
          form: function (b) { return '<b>Web form</b> from ' + b.client; },
          email: function (b) { return '<b>Email</b> from ' + b.client; },
          whatsapp: function (b) { return '<b>WhatsApp</b> from ' + b.client; },
          voice: function (b) { return '<b>Voice note</b> from ' + b.client + ' · ▶ 0:14'; },
          photo: function (b) { return '<b>Photo</b> of an invoice from ' + b.supplier + ', taken on a phone'; }
        },
        foreignIn: function (n) { return ', in ' + n; },
        ai: {
          classify: function (b, photo) { return '<b>AI sorts it:</b> ' + (photo ? 'supplier invoice · ' + b.cat : 'client request · high priority'); },
          extract: function (b, photo) { return '<b>Pulls out the data:</b> ' + (photo ? b.supplier + ' · 14/10 · total ' + b.total + ' · VAT ' + b.iva : b.client + ' · ' + b.item + ' · ' + b.day + ', ' + b.time); },
          transcribe: function (b) { return '<b>Transcribes it:</b> “Hi, it\'s ' + b.client + ', I\'d like ' + b.item + ' ' + b.whenText + '.”'; },
          reply: function () { return '<b>Drafts the reply</b> using your free slots.'; },
          translate: function (b, photo, n) { return '<b>Translates it</b> into English and drafts the reply in ' + n + '.'; }
        },
        dest: {
          calendar: function () { return '<b>Appointment created</b> in your calendar.'; },
          sheet: function () { return '<b>New row</b> in your spreadsheet.'; },
          crm: function (b) { return '<b>New record</b> for ' + b.client + ' in your CRM.'; },
          invoice: function (b) { return '<b>Invoice created</b> for ' + b.amount + '.'; },
          email: function (b, s) { return s.ai === 'classify' ? '<b>Forwarded</b> to the right person, with its label.' : '<b>Reply sent</b> by email.'; },
          whatsapp: function () { return '<b>Reply sent</b> on WhatsApp.'; }
        },
        extra: {
          alert: function () { return '<b>You get an alert</b> on your phone.'; },
          reminder: function (b, s) { return { calendar: '<b>Reminder</b> to the client the day before.', invoice: '<b>Payment reminder</b> if unpaid after 15 days.', crm: '<b>Automatic follow-up</b> in 3 days if there\'s no answer.' }[s.dest]; },
          review: function () { return '<b>Waits for your OK</b> before it goes out.'; },
          none: function () { return ''; }
        }
      },
      mock: {
        calTitle: 'Calendar', sheetCols: ['Date', 'Client', 'Asks for', 'When', 'Channel'], sheetColsPhoto: ['Date', 'Supplier', 'Category', 'Total', 'VAT'],
        sheetColsClass: ['Date', 'Client', 'Type', 'Priority', 'Channel'], typeReq: 'Request', high: 'High',
        crmStage: 'Stage', crmNew: 'New contact', crmInterest: 'Interested in', crmSource: 'Source', crmTask: 'Task', crmTaskText: 'Call tomorrow',
        crmTag: 'high priority',
        invNo: 'Invoice no. 2026-041', invTo: 'Client', invTotal: 'Total (VAT incl.)',
        mailTo: 'To', mailSubj: 'Subject', fwdSubj: '[Request] ', fwdBody: 'Forwarded automatically to the person who handles it.', team: 'orders',
        review: 'Waiting for your OK', approve: 'Approve', edit: 'Edit', sent: 'Approved and sent ✓', editing: 'You would open the draft to change it.',
        phone: 'Now', notif: {
          calendar: function (b) { return 'New booking: ' + b.client + ', ' + b.day + ' ' + b.time; },
          sheet: function () { return 'New row in your sheet'; },
          crm: function (b) { return 'New contact: ' + b.client; },
          invoice: function (b) { return 'Invoice created: ' + b.amount; },
          email: function (b) { return 'Replied: ' + b.client; },
          whatsapp: function (b) { return 'Replied: ' + b.client; }
        },
        remind: {
          calendar: function (b) { return 'Hi ' + b.client + ' 👋 Just a reminder: tomorrow at ' + b.time + ', ' + b.item + '. Reply YES to confirm or CHANGE.'; },
          invoice: function (b) { return 'Hi ' + b.client + ', a friendly reminder about invoice 2026-041 (' + b.amount + '). Thank you!'; },
          crm: function (b) { return 'Hi ' + b.client + ', did you get a chance to look at what I sent? Happy to talk it through this week.'; }
        }
      }
    }
  };
  var L = D[lang];

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- Build the board ------------------------------------------- */
  var state = { biz: 'peluqueria', trigger: null, ai: null, dest: null, extra: null };
  var busy = false;

  var bizBar = root.querySelector('.piezas__biz');
  bizBar.innerHTML = '<span class="piezas__biz-label">' + L.bizLabel + '</span>' +
    Object.keys(L.biz).map(function (k) {
      return '<button type="button" class="piezas__chip" data-biz="' + k + '" aria-pressed="' + (k === state.biz) + '">' + L.biz[k].label + '</button>';
    }).join('');

  var board = root.querySelector('.piezas__cols');
  board.innerHTML = STEPS.map(function (step, i) {
    var ids = Object.keys(L.pieces[step]);
    return '<div class="piezas__col" data-step="' + step + '"><p class="demo__label">' + L.cols[i] + '</p>' +
      ids.map(function (id) {
        return '<button type="button" class="piezas__piece" data-id="' + id + '" aria-pressed="false">' + icon(id) + '<span>' + L.pieces[step][id] + '</span></button>';
      }).join('') + '</div>';
  }).join('');

  var svg = root.querySelector('.piezas__lines');
  var stage = root.querySelector('.piezas__stage');
  var runBtn = root.querySelector('.piezas__run');
  var surpriseBtn = root.querySelector('.piezas__surprise');
  var status = root.querySelector('.piezas__status');
  var out = root.querySelector('.piezas__out');
  runBtn.textContent = L.run;
  surpriseBtn.textContent = L.surprise;

  function btn(step, id) { return board.querySelector('[data-step="' + step + '"] [data-id="' + id + '"]'); }

  /* Grey out what doesn't fit, drop later picks that stopped fitting. */
  function refresh() {
    STEPS.forEach(function (step, i) {
      var earlierDone = STEPS.slice(0, i).every(function (s) { return state[s]; });
      if (state[step] && (!earlierDone || (i > 0 && !fits[step](state, state[step])))) state[step] = null;
      board.querySelectorAll('[data-step="' + step + '"] .piezas__piece').forEach(function (b) {
        var id = b.getAttribute('data-id');
        var ok = i === 0 || (earlierDone && fits[step](state, id));
        b.disabled = !ok;
        b.title = ok ? '' : L.nofit;
        b.setAttribute('aria-pressed', String(state[step] === id));
      });
    });
    var ready = STEPS.every(function (s) { return state[s]; });
    runBtn.disabled = !ready || busy;
    if (!busy) status.textContent = ready ? L.ready : L.pick;
    drawLines();
  }

  /* Lines from each picked piece to the next: sideways when the next column
     sits to the right, downwards when the columns are stacked on phones. */
  function segment(a, b) {
    var s = stage.getBoundingClientRect(), ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    var x1, y1, x2, y2, d;
    if (rb.left >= ra.right - 4) {
      x1 = ra.right - s.left; y1 = ra.top + ra.height / 2 - s.top;
      x2 = rb.left - s.left; y2 = rb.top + rb.height / 2 - s.top;
      var mx = (x1 + x2) / 2;
      d = 'M' + x1 + ' ' + y1 + ' C' + mx + ' ' + y1 + ' ' + mx + ' ' + y2 + ' ' + x2 + ' ' + y2;
    } else {
      // stacked columns: loop out through the left margin so the line
      // doesn't run behind the other pieces
      x1 = ra.left - s.left; y1 = ra.top + ra.height / 2 - s.top;
      x2 = rb.left - s.left; y2 = rb.top + rb.height / 2 - s.top;
      d = 'M' + x1 + ' ' + y1 + ' C2 ' + y1 + ' 2 ' + y2 + ' ' + x2 + ' ' + y2;
    }
    return d;
  }
  var drawn = [];
  function drawLines(still) {
    var s = stage.getBoundingClientRect();
    svg.setAttribute('viewBox', '0 0 ' + s.width + ' ' + s.height);
    svg.setAttribute('width', s.width);
    svg.setAttribute('height', s.height);
    var paths = [];
    for (var i = 0; i < STEPS.length - 1; i++) {
      if (!state[STEPS[i]] || !state[STEPS[i + 1]]) break;
      paths.push(segment(btn(STEPS[i], state[STEPS[i]]), btn(STEPS[i + 1], state[STEPS[i + 1]])));
    }
    svg.innerHTML = paths.map(function (d, i) {
      var isNew = drawn[i] !== d && !reduced && !still;
      return '<path class="piezas__line' + (isNew ? ' is-new' : '') + '" d="' + d + '"/>';
    }).join('') + '<circle class="piezas__dot" r="6" cx="-20" cy="-20"/>';
    svg.querySelectorAll('.is-new').forEach(function (p) {
      var len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
      p.getBoundingClientRect();
      p.style.strokeDashoffset = 0;
    });
    drawn = paths;
  }

  board.addEventListener('click', function (e) {
    var b = e.target.closest('.piezas__piece');
    if (!b || b.disabled || busy) return;
    var step = b.closest('.piezas__col').getAttribute('data-step');
    var id = b.getAttribute('data-id');
    state[step] = state[step] === id ? null : id;
    out.hidden = true;
    refresh();
  });

  bizBar.addEventListener('click', function (e) {
    var b = e.target.closest('.piezas__chip');
    if (!b || busy) return;
    state.biz = b.getAttribute('data-biz');
    bizBar.querySelectorAll('.piezas__chip').forEach(function (c) { c.setAttribute('aria-pressed', String(c === b)); });
    if (!out.hidden) run(true);
  });

  /* ---------- Running the flow ------------------------------------------- */
  function moveDot(i, done) {
    var path = svg.querySelectorAll('.piezas__line')[i];
    var dot = svg.querySelector('.piezas__dot');
    if (!path || reduced) { done(); return; }
    var len = path.getTotalLength(), t0 = null, dur = 650;
    dot.classList.add('is-moving');
    function frame(ts) {
      if (!t0) t0 = ts;
      var k = Math.min(1, (ts - t0) / dur);
      var p = path.getPointAtLength(len * k);
      dot.setAttribute('cx', p.x); dot.setAttribute('cy', p.y);
      if (k < 1) requestAnimationFrame(frame); else { dot.classList.remove('is-moving'); done(); }
    }
    requestAnimationFrame(frame);
  }

  function result() {
    var b = L.biz[state.biz];
    var photo = state.trigger === 'photo';
    var foreign = state.ai === 'translate';
    var fb = D[other].biz[state.biz];
    var lines = [
      L.line.trigger[state.trigger](b) + (foreign ? L.line.foreignIn(L.otherLang) : '') +
        (TEXT.indexOf(state.trigger) > -1 ? ': ' + L.q[0] + esc(foreign ? D[other].ask(fb) : L.ask(b)) + L.q[1] : ''),
      L.line.ai[state.ai](b, photo, L.otherLang),
      L.line.dest[state.dest](b, state),
      L.line.extra[state.extra](b, state)
    ];
    var replyText = foreign ? D[other].answer(fb) : L.answer(b);
    var M = L.mock, html = '';
    var channel = L.channel[state.trigger];
    switch (state.dest) {
      case 'calendar':
        html = '<div class="mock mock--cal"><p class="mock__bar">' + icon('calendar') + M.calTitle + ' · ' + b.day + '</p>' +
          ['09:00', b.time, '19:00'].map(function (t) {
            return t === b.time
              ? '<p class="mock__slot is-new"><b>' + t + '</b> ' + esc(b.item) + ' · ' + b.client + '</p>'
              : '<p class="mock__slot"><b>' + t + '</b></p>';
          }).join('') + '</div>';
        break;
      case 'sheet':
        var cols = photo ? M.sheetColsPhoto : state.ai === 'classify' ? M.sheetColsClass : M.sheetCols;
        var row = photo ? ['14/10', b.supplier, b.cat, b.total, b.iva]
          : state.ai === 'classify' ? ['19/10', b.client, M.typeReq, M.high, channel]
          : ['19/10', b.client, b.item, b.day + ' ' + b.time, channel];
        html = '<div class="mock mock--sheet"><table><thead><tr>' + cols.map(function (c) { return '<th>' + c + '</th>'; }).join('') +
          '</tr></thead><tbody><tr><td>12/10</td><td>…</td><td>…</td><td>…</td><td>…</td></tr><tr class="is-new">' +
          row.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr></tbody></table></div>';
        break;
      case 'crm':
        html = '<div class="mock mock--crm"><p class="mock__crm-name">' + icon('crm') + b.client + (state.ai === 'classify' ? ' <span class="mock__tag">' + M.crmTag + '</span>' : '') + '</p>' +
          '<dl><dt>' + M.crmInterest + '</dt><dd>' + esc(b.item) + '</dd><dt>' + M.crmSource + '</dt><dd>' + channel + '</dd>' +
          '<dt>' + M.crmStage + '</dt><dd>' + M.crmNew + '</dd><dt>' + M.crmTask + '</dt><dd>' + M.crmTaskText + '</dd></dl></div>';
        break;
      case 'invoice':
        html = '<div class="mock mock--inv"><p class="mock__inv-head"><b>' + b.name + '</b><span>' + M.invNo + '</span></p>' +
          '<p>' + M.invTo + ': ' + b.client + '</p><p class="mock__inv-line"><span>' + esc(b.item) + '</span><span>' + b.amount + '</span></p>' +
          '<p class="mock__inv-total"><span>' + M.invTotal + '</span><b>' + b.amount + '</b></p></div>';
        break;
      case 'email':
        html = state.ai === 'classify'
          ? '<div class="mock mock--mail"><p><b>' + M.mailTo + ':</b> ' + M.team + '@' + b.name.normalize('NFD').toLowerCase().replace(/[^a-z]+/g, '') + '.es</p><p><b>' + M.mailSubj + ':</b> ' + M.fwdSubj + b.client + ' · ' + esc(b.item) + '</p><p class="mock__mail-body">' + M.fwdBody + '</p></div>'
          : '<div class="mock mock--mail"><p><b>' + M.mailTo + ':</b> ' + b.client + '</p><p><b>' + M.mailSubj + ':</b> Re: ' + esc(foreign ? fb.item : b.item) + '</p><p class="mock__mail-body">' + esc(replyText) + '<br><br>' + b.name + '</p></div>';
        break;
      case 'whatsapp':
        html = '<div class="mock mock--wa"><p class="mock__bar">' + icon('whatsapp') + b.client + '</p><p class="mock__bubble mock__bubble--in">' + esc(foreign ? D[other].ask(fb) : L.ask(b)) + '</p><p class="mock__bubble mock__bubble--out">' + esc(replyText) + '</p></div>';
        break;
    }
    var extra = '';
    if (state.extra === 'alert') {
      extra = '<div class="mock mock--notif"><p class="mock__bar">' + icon('alert') + b.name + '<span>' + M.phone + '</span></p><p>' + esc(M.notif[state.dest](b)) + '</p></div>';
    } else if (state.extra === 'reminder') {
      extra = '<div class="mock mock--wa mock--small"><p class="mock__bubble mock__bubble--out">' + esc(M.remind[state.dest](b)) + '</p></div>';
    } else if (state.extra === 'review') {
      extra = '<div class="mock mock--review"><p class="mock__bar">' + icon('review') + M.review + '</p><p class="mock__review-btns"><button type="button" class="chat__choice" data-approve>' + M.approve + '</button> <button type="button" class="chat__choice" data-edit>' + M.edit + '</button></p></div>';
    }
    var flowText = STEPS.map(function (s) { return L.pieces[s][state[s]]; }).join(' → ');
    var minutes = MINUTES[state.dest] + (MINUTES[state.ai] || 0) + MINUTES[state.extra];
    return {
      lines: lines.filter(Boolean),
      html: '<div class="piezas__mocks">' + html + extra + '</div>' +
        '<p class="piezas__saved">' + L.manual(minutes) + '</p>' +
        '<p><a class="btn btn--primary" target="_blank" rel="noopener" href="https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(L.wa(flowText)) + '">' + L.cta + ' <span class="arrow" aria-hidden="true">→</span></a></p>'
    };
  }

  // instant: redraw the result straight away (used when only the business changes)
  function run(instant) {
    instant = instant === true;
    if (busy || !STEPS.every(function (s) { return state[s]; })) return;
    busy = true; refresh();
    status.textContent = L.running;
    var r = result();
    var trace = out.querySelector('.piezas__trace');
    var res = out.querySelector('.piezas__result');
    trace.innerHTML = ''; res.innerHTML = '';
    out.hidden = false;
    var i = 0;
    function next() {
      if (i < r.lines.length) {
        var li = document.createElement('li');
        li.innerHTML = r.lines[i];
        trace.appendChild(li);
        i++;
        if (instant) next();
        else if (i - 1 < STEPS.length - 1) moveDot(i - 1, next);
        else setTimeout(next, reduced ? 0 : 300);
      } else {
        res.innerHTML = r.html;
        busy = false;
        status.textContent = L.done;
        surpriseBtn.textContent = L.again;
        refresh();
        if (window.umami) window.umami.track('Piezas', { flow: STEPS.map(function (s) { return state[s]; }).join('>') });
      }
    }
    next();
  }

  out.addEventListener('click', function (e) {
    var t = e.target;
    if (t.matches('[data-approve]')) t.parentNode.innerHTML = '<b>' + L.mock.sent + '</b>';
    else if (t.matches('[data-edit]')) t.parentNode.innerHTML = L.mock.editing;
  });

  /* "Surprise me": a random path through pieces that fit, then run it. */
  function surprise() {
    if (busy) return;
    var pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
    var s = { biz: state.biz };
    STEPS.forEach(function (step, i) {
      var ids = Object.keys(L.pieces[step]).filter(function (id) { return i === 0 || fits[step](s, id); });
      s[step] = pick(ids);
    });
    STEPS.forEach(function (step) { state[step] = s[step]; });
    drawn = [];
    refresh();
    setTimeout(run, reduced ? 0 : 600);
  }

  runBtn.addEventListener('click', run);
  surpriseBtn.addEventListener('click', surprise);
  window.addEventListener('resize', function () { drawLines(true); });
  refresh();
  root.classList.add('is-ready');
})();
