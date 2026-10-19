"""Build the demo page /pruebalo/ (ES) and /en/try-it/ (EN).

Run from the repo root:  python3 _demos/build.py
Borrows the page shell (head, menu, footer) from the blog builder, so menu or
footer changes on the other pages carry over on the next run. The demos
themselves live in /pruebalo.js; this file only writes their HTML and text.
"""
import html
import importlib.util
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("blog", os.path.join(ROOT, "_blog/build.py"))
blog = importlib.util.module_from_spec(spec)
spec.loader.exec_module(blog)

PATHS = {"es": "/pruebalo/", "en": "/en/try-it/"}
JS_VERSION = 2

C = {
    "es": dict(
        title="Pruébalo: demos de automatización e IA | pleko",
        desc="Demos que puedes tocar: oculta datos sensibles antes de usar la IA, mira cómo un asistente reserva citas y cómo viajan los datos entre apps.",
        crumb="Pruébalo",
        label="Demos",
        h1="Pruébalo tú.",
        lead="Demos que puedes tocar, no vídeos. Cada una te dice si funciona de verdad o si es una simulación con datos de ejemplo.",
        live="En directo", live_note="funciona de verdad, aquí mismo.",
        sim="Simulación", sim_note="puedes hacer clic, pero con datos de ejemplo.",
        private="Lo que escribes en estas demos no sale de tu navegador: no se envía ni se guarda en ningún sitio.",
        how="Cómo está hecho",
        soon="Muy pronto, más demos en directo conectadas a herramientas reales.",
        cta_label="Hablemos", cta_h="¿Quieres algo así en tu negocio?",
        cta_p="Reserva una llamada gratuita de 20 minutos y vemos qué se puede automatizar en tu caso.",
        cta_btn="Reserva una llamada",
        # 1. Detector
        d_title="Detector de datos sensibles",
        d_intro="Antes de pegar un texto en una IA, conviene quitar lo personal. Escribe o pega un texto y verás los datos sensibles marcados y una versión anónima lista para usar.",
        d_label="Tu texto",
        d_sample_btn="Usar un texto de ejemplo",
        d_sample="Hola, soy Laura García Pérez, con DNI 45127391B. Te paso mi IBAN ES91 2100 0418 4502 0005 1332 para el reembolso. Si hay algún problema, llámame al 612 345 678 o escríbeme a laura.garcia@ejemplo.com. Gracias, Laura",
        d_marked="Lo que he encontrado",
        d_anon="Versión anónima",
        d_copy="Copiar",
        d_how="Reglas que reconocen DNI y NIE (comprobando la letra), IBAN, teléfonos, emails, tarjetas (con su dígito de control) y nombres comunes. Todo ocurre en tu navegador. Ninguna detección es perfecta, por eso una persona revisa siempre lo importante.",
        # 2. Booking
        b_title="Recepcionista de citas",
        b_intro="Así reserva un cliente en una peluquería cuando el asistente está conectado al calendario y a WhatsApp. Elige las respuestas y mira cómo se llena el calendario.",
        b_salon="Peluquería Tijeras (salón ficticio)",
        b_steps=[
            dict(key="servicio", q="¡Hola! Soy el asistente de Peluquería Tijeras. ¿Qué te hacemos?", options=["Corte", "Color", "Peinado"]),
            dict(key="dia", q="Perfecto. ¿Qué día te va bien?", options=["Martes", "Miércoles", "Jueves"]),
            dict(key="hora", q="Tengo estos huecos libres. ¿Cuál prefieres?", options=["10:00", "12:30", "17:00"]),
        ],
        b_done="¡Hecho! Te espero el {dia} a las {hora} para {servicio}. Te mandaré un recordatorio el día antes.",
        b_reminder="Hola 👋 Te recuerdo tu cita de {servicio} mañana a las {hora}. Responde SÍ para confirmar o CAMBIAR si te viene mal.",
        b_cal="Calendario del salón",
        b_wa="Recordatorio por WhatsApp, el día antes",
        b_how="En un salón de verdad, el asistente lee los huecos libres del calendario, guarda la cita y programa el recordatorio. Aquí todo es de ejemplo: no se reserva nada.",
        # 3. Flow
        f_title="Conecta las piezas",
        f_intro="Una automatización es esto: algo llega, la IA lo procesa y acaba donde tiene que estar, sin que nadie copie y pegue. Elige tu negocio y una pieza de cada columna, o pulsa «Sorpréndeme».",
        f_noscript="Esta demo necesita JavaScript.",
        f_how="Con herramientas como n8n o Make, cada pieza es un paso. Aquí ves ejemplos con datos inventados; en tu negocio serían tus formularios, tu correo y tus apps de verdad. Las piezas en gris no encajan con lo que has elegido antes.",
    ),
    "en": dict(
        title="Try it: automation and AI demos | pleko",
        desc="Demos you can play with: hide sensitive data before using AI, watch an assistant book appointments and see data travel between apps.",
        crumb="Try it",
        label="Demos",
        h1="Try it yourself.",
        lead="Demos you can play with, not videos. Each one tells you whether it really runs or is a simulation with sample data.",
        live="Live", live_note="it really runs, right here.",
        sim="Simulation", sim_note="you can click through it, but with sample data.",
        private="What you type into these demos never leaves your browser: it isn't sent or stored anywhere.",
        how="How it's built",
        soon="More live demos, connected to real tools, coming soon.",
        cta_label="Let's talk", cta_h="Want something like this in your business?",
        cta_p="Book a free 20-minute call and we'll see what could be automated in your case.",
        cta_btn="Book a call",
        d_title="Sensitive-data detector",
        d_intro="Before pasting a text into an AI, it's worth removing the personal bits. Type or paste a text and you'll see the sensitive data marked and an anonymous version ready to use.",
        d_label="Your text",
        d_sample_btn="Use a sample text",
        d_sample="Hi, I'm Laura García Pérez, ID number 45127391B. Here's my IBAN ES91 2100 0418 4502 0005 1332 for the refund. If anything goes wrong, call me on 612 345 678 or email laura.garcia@ejemplo.com. Thanks, Laura",
        d_marked="What I found",
        d_anon="Anonymous version",
        d_copy="Copy",
        d_how="Rules that recognise Spanish ID numbers (checking the letter), IBANs, phone numbers, emails, cards (with their check digit) and common first names. It all happens in your browser. No detection is perfect, which is why a person always checks what matters.",
        b_title="Booking receptionist",
        b_intro="This is how a client books at a hair salon when the assistant is connected to the calendar and to WhatsApp. Pick the answers and watch the calendar fill in.",
        b_salon="Tijeras hair salon (a made-up salon)",
        b_steps=[
            dict(key="servicio", q="Hi! I'm the Tijeras salon assistant. What can we do for you?", options=["Cut", "Colour", "Styling"]),
            dict(key="dia", q="Great. Which day suits you?", options=["Tuesday", "Wednesday", "Thursday"]),
            dict(key="hora", q="These slots are free. Which one would you like?", options=["10:00", "12:30", "17:00"]),
        ],
        b_done="Done! See you on {dia} at {hora} for your {servicio}. I'll send you a reminder the day before.",
        b_reminder="Hi 👋 Just a reminder of your {servicio} tomorrow at {hora}. Reply YES to confirm or CHANGE if it no longer suits you.",
        b_cal="Salon calendar",
        b_wa="WhatsApp reminder, the day before",
        b_how="In a real salon, the assistant reads the free slots from the calendar, saves the booking and schedules the reminder. Here everything is sample data: nothing gets booked.",
        f_title="Connect the pieces",
        f_intro="This is what an automation is: something comes in, AI processes it and it lands where it should, without anyone copying and pasting. Pick your business and one piece from each column, or press “Surprise me”.",
        f_noscript="This demo needs JavaScript.",
        f_how="In tools like n8n or Make, each piece is one step. These examples use made-up data; in your business they would be your real forms, email and apps. Greyed-out pieces don't fit what you picked before.",
    ),
}


def a(s):
    return html.escape(s, quote=True)


def badge(c, live):
    return f'<span class="demo__badge demo__badge--{"live" if live else "sim"}">{c["live"] if live else c["sim"]}</span>'


def section(c, id_, live, title, intro, body, how, alt=False):
    return f'''
    <section class="subpage-block{" subpage-block--alt" if alt else ""} demo" id="{id_}">
      <div class="wrap">
        <div class="section-head section-head--sub">
          {badge(c, live)}
          <h2 class="h3-display">{title}</h2>
          <p class="lead">{intro}</p>
        </div>
        {body}
        <p class="demo__how"><strong>{c["how"]}:</strong> {how}</p>
      </div>
    </section>'''


def build(lang):
    c = C[lang]
    path = PATHS[lang]
    other = PATHS["en" if lang == "es" else "es"]
    book = "/#reserva" if lang == "es" else "/en/#book"

    detect = section(c, "demo-datos", True, c["d_title"], c["d_intro"], f'''<div class="demo__box detect">
          <div>
            <label class="demo__label" for="detect-input">{c["d_label"]}</label>
            <textarea id="detect-input" rows="7" spellcheck="false"></textarea>
            <button type="button" class="chat__choice" data-sample="{a(c["d_sample"])}">{c["d_sample_btn"]}</button>
          </div>
          <div>
            <p class="demo__label">{c["d_marked"]}</p>
            <p class="detect__marked"></p>
            <p class="detect__summary" aria-live="polite"></p>
            <p class="demo__label">{c["d_anon"]} <button type="button" class="chat__choice chat__choice--small" data-copy>{c["d_copy"]}</button></p>
            <p class="detect__anon"></p>
          </div>
        </div>''', c["d_how"], alt=True)

    days = c["b_steps"][1]["options"]
    times = c["b_steps"][2]["options"]
    grid = "".join(f'<span class="week__head">{d[:3]}</span>' for d in days)
    for t in times:
        grid += "".join(f'<span class="week__slot" data-day="{a(d)}" data-time="{t}" data-t="{t}"></span>' for d in days)
    booking = section(c, "demo-citas", False, c["b_title"], c["b_intro"], f'''<div class="demo__box booking">
          <div class="chat">
            <p class="chat__title">{c["b_salon"]}</p>
            <div class="chat__log" aria-live="polite"></div>
            <div class="chat__choices"></div>
          </div>
          <div class="booking__side">
            <p class="demo__label">{c["b_cal"]}</p>
            <div class="week">{grid}</div>
            <div class="reminder" hidden>
              <p class="demo__label">{c["b_wa"]}</p>
              <p class="reminder__text"></p>
            </div>
          </div>
        </div>''', c["b_how"])
    # The JS reads the chat script from data attributes on the section itself.
    booking = booking.replace(
        f'id="demo-citas">',
        f'id="demo-citas" data-steps="{a(json.dumps(c["b_steps"], ensure_ascii=False))}" data-done="{a(c["b_done"])}" data-reminder="{a(c["b_reminder"])}">', 1)

    flow = section(c, "demo-piezas", False, c["f_title"], c["f_intro"], f'''<div class="demo__box piezas" id="demo-piezas-app">
          <div class="piezas__biz" role="group"></div>
          <div class="piezas__stage">
            <svg class="piezas__lines" aria-hidden="true"></svg>
            <div class="piezas__cols"><noscript><p>{c["f_noscript"]}</p></noscript></div>
          </div>
          <div class="piezas__bar">
            <button type="button" class="btn btn--primary piezas__run" disabled></button>
            <button type="button" class="chat__choice piezas__surprise"></button>
            <span class="piezas__status" aria-live="polite"></span>
          </div>
          <div class="piezas__out" hidden>
            <ol class="piezas__trace"></ol>
            <div class="piezas__result"></div>
          </div>
        </div>''', c["f_how"])
    nav = "".join(f'<a href="#{i}">{t}</a>' for i, t in [("demo-piezas", c["f_title"]), ("demo-datos", c["d_title"]), ("demo-citas", c["b_title"])])
    main = f'''
    <section class="subpage-hero">
      <div class="wrap">
        <div class="section-head">
          <p class="section-label">{c["label"]}</p>
          <h1 class="h2">{c["h1"]}</h1>
          <p class="lead">{c["lead"]}</p>
          <ul class="demo__legend">
            <li>{badge(c, True)} {c["live_note"]}</li>
            <li>{badge(c, False)} {c["sim_note"]}</li>
          </ul>
          <p class="demo__private">{c["private"]}</p>
          <nav class="demo__nav" aria-label="Demos">{nav}</nav>
        </div>
      </div>
    </section>{flow}{detect}{booking}
    <section class="subpage-block">
      <div class="wrap">
        <aside class="callout">
          <p class="section-label">{c["cta_label"]}</p>
          <h2 class="h3-display">{c["cta_h"]}</h2>
          <p>{c["cta_p"]}</p>
          <p><a href="{book}" class="btn btn--primary">{c["cta_btn"]} <span class="arrow" aria-hidden="true">→</span></a></p>
          <p class="callout__note">{c["soon"]}</p>
        </aside>
      </div>
    </section>'''

    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "WebPage", "name": c["title"], "url": blog.SITE + path, "inLanguage": lang, "description": c["desc"]},
        blog.crumbs(lang, [("pleko", "/" if lang == "es" else "/en/"), (c["crumb"], path)]),
    ]}
    out = blog.page(lang, path, other, c["title"], c["desc"], ld, main)
    # The shell ends with the booking band from its source page; keep it, and load the demo script.
    out = out.replace('<script src="/site.js', f'<script src="/piezas.js?v={JS_VERSION}" defer></script>\n    <script src="/pruebalo.js?v={JS_VERSION}" defer></script>\n    <script src="/site.js', 1)
    blog.write(path, out)


if __name__ == "__main__":
    for l in ("es", "en"):
        build(l)
    print("Built", ", ".join(PATHS.values()))
