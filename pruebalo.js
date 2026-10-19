/* =========================================================================
   pleko · demos on /pruebalo/ and /en/try-it/
   Everything here runs in the visitor's browser. Nothing typed into these
   demos is sent anywhere (no fetch, no storage), which the page promises.
   Text for both languages lives in T below; the page's <html lang> picks one.
   ========================================================================= */
(function () {
  'use strict';

  var lang = document.documentElement.lang === 'en' ? 'en' : 'es';
  var T = {
    es: {
      found: function (n) { return n === 1 ? '1 dato sensible encontrado.' : n + ' datos sensibles encontrados.'; },
      clean: 'No he encontrado datos sensibles. Aun así, revisa siempre a mano: ninguna detección es perfecta.',
      copied: '¡Copiado!',
      tags: { NOMBRE: 'NOMBRE', DNI: 'DNI', IBAN: 'IBAN', TELEFONO: 'TELEFONO', EMAIL: 'EMAIL', TARJETA: 'TARJETA' },
      kinds: { NOMBRE: 'Nombre', DNI: 'DNI/NIE', IBAN: 'IBAN', TELEFONO: 'Teléfono', EMAIL: 'Email', TARJETA: 'Tarjeta' },
      again: 'Empezar de nuevo'
    },
    en: {
      found: function (n) { return n === 1 ? '1 piece of sensitive data found.' : n + ' pieces of sensitive data found.'; },
      clean: "I didn't find any sensitive data. Still, always check by hand: no detection is perfect.",
      copied: 'Copied!',
      tags: { NOMBRE: 'NAME', DNI: 'ID', IBAN: 'IBAN', TELEFONO: 'PHONE', EMAIL: 'EMAIL', TARJETA: 'CARD' },
      kinds: { NOMBRE: 'Name', DNI: 'ID number', IBAN: 'IBAN', TELEFONO: 'Phone', EMAIL: 'Email', TARJETA: 'Card' },
      again: 'Start over'
    }
  }[lang];

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Sensitive-data detector ----------------------------------
     Regular expressions for Spanish ID numbers (with the check letter), IBANs,
     phones, emails and card numbers (Luhn check), plus names that follow a
     common first name. Each value gets a stable placeholder like [NOMBRE_1]. */
  var det = $('#demo-datos');
  if (det) {
    var input = $('textarea', det);
    var marked = $('.detect__marked', det);
    var anon = $('.detect__anon', det);
    var summary = $('.detect__summary', det);
    var firstNames = 'Alejandro Alba Alex Alexandros Ana Andrea Antonio Carlos Carmen Clara Cristina Daniel David Elena Emma Francisco Isabel Javier Jordi Jorge José Josep Juan Laura Lucía Luis Manuel Marc María Marta Miguel Montse Nuria Núria Pablo Pau Paula Pedro Pilar Raquel Rosa Sara Sergio Sofía Teresa Victoria John Jane James Mary Michael Sarah David Emily Tom Laura'.split(' ');
    var cap = '[A-ZÁÉÍÓÚÑÜ][a-záéíóúñüç]+';
    var nameRe = new RegExp('\\b(?:' + firstNames.join('|') + ')(?![A-Za-zÀ-ÿ])(?:\\s+(?:de\\s+(?:la\\s+)?)?' + cap + '){0,2}', 'g');
    var dniLetters = 'TRWAGMYFPDXBNJZSQVHLCKE';
    var luhn = function (s) {
      var d = s.replace(/\D/g, ''), sum = 0;
      for (var i = 0; i < d.length; i++) {
        var n = +d[d.length - 1 - i];
        if (i % 2) { n *= 2; if (n > 9) n -= 9; }
        sum += n;
      }
      return d.length >= 13 && sum % 10 === 0;
    };
    var rules = [
      { kind: 'EMAIL', re: /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g },
      { kind: 'IBAN', re: /\b[A-Z]{2}\d{2}(?:[ ]?\d{4}){4,7}\b/g },
      { kind: 'TARJETA', re: /\b(?:\d[ -]?){13,19}\b/g, ok: luhn },
      { kind: 'DNI', re: /\b[XYZ]?\d{7,8}[ -]?[A-Z]\b/g, ok: function (s) {
          var c = s.replace(/[ -]/g, ''), num = c.slice(0, -1).replace('X', '0').replace('Y', '1').replace('Z', '2');
          return dniLetters[parseInt(num, 10) % 23] === c.slice(-1);
        } },
      { kind: 'TELEFONO', re: /(?:\+34[ ]?)?\b[6789]\d{2}(?:[ ]?\d{2,3}){2,3}\b/g, ok: function (s) { return s.replace(/\D/g, '').replace(/^34/, '').length === 9; } },
      { kind: 'NOMBRE', re: nameRe }
    ];
    var run = function () {
      var text = input.value;
      var hits = [];
      rules.forEach(function (r) {
        r.re.lastIndex = 0;
        var m;
        while ((m = r.re.exec(text))) {
          var s = m.index, e = s + m[0].length;
          if (r.ok && !r.ok(m[0])) continue;
          if (hits.some(function (h) { return s < h.e && e > h.s; })) continue;
          hits.push({ s: s, e: e, kind: r.kind, v: m[0] });
        }
      });
      hits.sort(function (a, b) { return a.s - b.s; });
      var ids = {}, count = {};
      hits.forEach(function (h) {
        // a first name on its own ("Laura") is the same person as "Laura García" earlier
        var key = h.kind + '|' + (h.kind === 'NOMBRE' ? h.v.split(/\s+/)[0] : h.v).toLowerCase();
        if (!ids[key]) { count[h.kind] = (count[h.kind] || 0) + 1; ids[key] = '[' + T.tags[h.kind] + '_' + count[h.kind] + ']'; }
        h.tag = ids[key];
      });
      var a = '', b = '', i = 0;
      hits.forEach(function (h) {
        a += esc(text.slice(i, h.s)) + '<mark class="detect__hit" title="' + esc(T.kinds[h.kind]) + '">' + esc(h.v) + '</mark>';
        b += text.slice(i, h.s) + h.tag;
        i = h.e;
      });
      a += esc(text.slice(i)); b += text.slice(i);
      marked.innerHTML = a || '&nbsp;';
      anon.textContent = b;
      summary.textContent = hits.length ? T.found(hits.length) : T.clean;
    };
    input.addEventListener('input', run);
    $('[data-sample]', det).addEventListener('click', function () { input.value = this.getAttribute('data-sample'); run(); });
    $('[data-copy]', det).addEventListener('click', function () {
      var btn = this, label = btn.textContent;
      if (navigator.clipboard) navigator.clipboard.writeText(anon.textContent).then(function () {
        btn.textContent = T.copied; setTimeout(function () { btn.textContent = label; }, 1500);
      });
    });
    run();
  }

  /* ---------- 2. Booking receptionist (simulation) ------------------------
     A scripted chat with buttons. Each answer fills the next step; at the
     end the slot lights up in the week view and a reminder preview appears. */
  var book = $('#demo-citas');
  if (book) {
    var log = $('.chat__log', book);
    var choices = $('.chat__choices', book);
    var steps = JSON.parse(book.getAttribute('data-steps'));
    var picked = {};
    var say = function (who, html) {
      var p = document.createElement('p');
      p.className = 'chat__msg chat__msg--' + who;
      p.innerHTML = html;
      log.appendChild(p);
      log.scrollTop = log.scrollHeight;
    };
    var step = function (i) {
      choices.innerHTML = '';
      if (i >= steps.length) return finish();
      var st = steps[i];
      var ask = function () {
        say('bot', st.q);
        st.options.forEach(function (o) {
          var b = document.createElement('button');
          b.type = 'button'; b.className = 'chat__choice'; b.textContent = o;
          b.addEventListener('click', function () { picked[st.key] = o; say('me', esc(o)); step(i + 1); });
          choices.appendChild(b);
        });
      };
      reduced ? ask() : setTimeout(ask, 450);
    };
    var finish = function () {
      // mid-sentence, "Color" and "Jueves" read better in lower case (English keeps its capital days)
      var serv = picked.servicio.toLowerCase();
      var dia = lang === 'es' ? picked.dia.toLowerCase() : picked.dia;
      var conf = book.getAttribute('data-done')
        .replace('{servicio}', esc(serv)).replace('{dia}', esc(dia)).replace('{hora}', esc(picked.hora));
      setTimeout(function () {
        say('bot', conf);
        var cell = $('.week [data-day="' + picked.dia + '"][data-time="' + picked.hora + '"]', book);
        if (cell) { cell.classList.add('is-booked'); cell.textContent = picked.servicio; }
        var rem = $('.reminder', book);
        $('.reminder__text', rem).textContent = book.getAttribute('data-reminder')
          .replace('{servicio}', serv).replace('{hora}', picked.hora);
        rem.hidden = false;
        var again = document.createElement('button');
        again.type = 'button'; again.className = 'chat__choice'; again.textContent = '↺ ' + T.again;
        again.addEventListener('click', reset);
        choices.appendChild(again);
      }, reduced ? 0 : 450);
    };
    var reset = function () {
      log.innerHTML = ''; picked = {};
      $$('.week .is-booked', book).forEach(function (c) { c.classList.remove('is-booked'); c.textContent = ''; });
      $('.reminder', book).hidden = true;
      step(0);
    };
    reset();
  }
})();
