"""Build the blog pages from the Markdown posts in _blog/posts/.

Run from the repo root:  python3 _blog/build.py

Each post is a .md file with a small header (lang, slug, pair, title,
subtitle, date). The ES/EN page shell (head, menu, footer) is borrowed
from the "IA con cabeza" pages so the blog always matches the rest of
the site. Writes /blog/, /blog/<slug>/, /en/blog/ and /en/blog/<slug>/.
Folders starting with "_" are not published by GitHub Pages.
"""
import html
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://pleko.es"

L = {
    "es": dict(
        shell="ia-con-cabeza/index.html", shell_path="/ia-con-cabeza/", other_shell_path="/en/ai-with-judgement/",
        blog="/blog/", label="Blog", index_title="Blog de pleko: automatización e IA sin humo",
        index_desc="Lo que voy aprendiendo al llevar la automatización y la IA al trabajo real: ideas, experimentos y herramientas, contados de la forma más clara que sé.",
        index_h1="Pensando en voz alta.", all_tags="Todos", latest="Último texto", filter_label="Filtrar por tema",
        index_lead="Lo que voy aprendiendo al llevar la IA al trabajo real: ideas, experimentos y herramientas. Sin humo y sin intentar venderte nada.",
        read="Leer", back="← Todos los textos", by="Alexandros Reïzos",
        cta_label="Hablemos", cta_h="¿Quieres aplicar esto en tu trabajo?",
        cta_p="Reserva una llamada gratuita de 20 minutos y vemos por dónde empezar.",
        cta_btn="Reserva una llamada", months=["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
        mins="min de lectura", locale="es_ES"),
    "en": dict(
        shell="en/ai-with-judgement/index.html", shell_path="/en/ai-with-judgement/", other_shell_path="/ia-con-cabeza/",
        blog="/en/blog/", label="Blog", index_title="The pleko blog: automation and AI without the hype",
        index_desc="What I'm learning as I bring automation and AI into real work: ideas, experiments and tools, explained as clearly as I can.",
        index_h1="Thinking out loud.", all_tags="All", latest="Latest post", filter_label="Filter by topic",
        index_lead="What I'm learning as I bring AI into real work: ideas, experiments and tools. No hype, and no trying to sell you anything.",
        read="Read", back="← All posts", by="Alexandros Reïzos",
        cta_label="Let's talk", cta_h="Want to put this to work?",
        cta_p="Book a free 20-minute call and we'll see where to start.",
        cta_btn="Book a call", months=["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        mins="min read", locale="en_GB"),
}


def read_post(path):
    raw = open(path, encoding="utf-8").read()
    _, head, body = raw.split("---\n", 2)
    meta = dict(line.split(": ", 1) for line in head.strip().splitlines())
    meta["body"] = body.strip()
    return meta


def inline(text):
    text = html.escape(text, quote=False)
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"(?<!\*)\*(?!\*)(.+?)\*", r"<em>\1</em>", text)

    def link(m):
        label, url = m.group(1), m.group(2)
        ext = url.startswith("http")
        attrs = ' target="_blank" rel="noopener"' if ext else ""
        return f'<a href="{url}"{attrs}>{label}</a>'
    return re.sub(r"\[(.+?)\]\((.+?)\)", link, text)


def markdown(md):
    out, block = [], []
    for para in re.split(r"\n\s*\n", md):
        lines = para.strip().splitlines()
        if not lines:
            continue
        if lines[0].startswith("## "):
            out.append(f"<h2>{inline(lines[0][3:])}</h2>")
        elif lines[0] == "---":
            out.append("<hr />")
        elif all(l.startswith("- ") for l in lines):
            out.append("<ul>" + "".join(f"<li>{inline(l[2:])}</li>" for l in lines) + "</ul>")
        elif all(re.match(r"\d+\. ", l) for l in lines):
            out.append('<ol class="post__sources">' + "".join(f"<li>{inline(l.split('. ', 1)[1])}</li>" for l in lines) + "</ol>")
        else:
            out.append(f"<p>{inline(' '.join(lines))}</p>")
    return "\n          ".join(out)


def tags_of(p):
    return [t.strip() for t in p.get("tags", "").split(",") if t.strip()]


def tag_id(t):
    t = t.lower()
    for a, b in zip("áéíóúüñ", "aeiouun"):
        t = t.replace(a, b)
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")


def tag_chips(tags):
    return "".join(f'<span class="chip">{html.escape(t)}</span>' for t in tags)


def nice_date(d, lang):
    y, m, dd = map(int, d.split("-"))
    if lang == "es":
        return f"{dd} de {L['es']['months'][m - 1]} de {y}"
    return f"{dd} {L['en']['months'][m - 1]} {y}"


def shell(lang):
    s = open(os.path.join(ROOT, L[lang]["shell"]), encoding="utf-8").read()
    head_end = s.index("<!-- Structured data")
    top = s[:head_end]
    # Keep anything after the structured data (e.g. the Umami script) along with the nav.
    nav_start = s.index("</script>", head_end) + len("</script>\n")
    main_start = s.index('  <main id="top">')
    main_end = s.index("  </main>") + len("  </main>")
    return top, s[nav_start:main_start], s[main_end:]


def page(lang, path, other_path, title, desc, ld, main, og_type="website"):
    top, nav, foot = shell(lang)
    cfg = L[lang]
    url = SITE + path
    top = re.sub(r"<title>.*?</title>", f"<title>{html.escape(title)}</title>", top)
    for prop in ('name="description"', 'property="og:description"'):
        top = re.sub(rf'(<meta {prop} content=")[^"]*', lambda m: m.group(1) + html.escape(desc), top)
    top = re.sub(r'(<meta property="og:title" content=")[^"]*', lambda m: m.group(1) + html.escape(title), top)
    top = re.sub(r'(<link rel="canonical" href=")[^"]*', lambda m: m.group(1) + url, top)
    top = re.sub(r'(<meta property="og:url" content=")[^"]*', lambda m: m.group(1) + url, top)
    top = top.replace('<meta property="og:type" content="website" />', f'<meta property="og:type" content="{og_type}" />')
    es_path, en_path = (path, other_path) if lang == "es" else (other_path, path)
    top = re.sub(r'(hreflang="es" href=")[^"]*', lambda m: m.group(1) + SITE + es_path, top)
    top = re.sub(r'(hreflang="en" href=")[^"]*', lambda m: m.group(1) + SITE + en_path, top)
    top = re.sub(r'(hreflang="x-default" href=")[^"]*', lambda m: m.group(1) + SITE + es_path, top)
    # Only the language switch points at this page; the Resources dropdown keeps its own links
    nav = re.sub(r'<div class="lang-toggle".*?</div>', lambda m: m.group(0).replace(f'href="{cfg["shell_path"]}"', f'href="{path}"').replace(f'href="{cfg["other_shell_path"]}"', f'href="{other_path}"'), nav, count=1, flags=re.S)
    nav = nav.replace('<details class="menu-more is-current">', '<details class="menu-more">').replace(' aria-current="page">', '>', 1) if 'menu-more is-current' in nav else nav
    for u in re.findall(r'<a href="(/[^"]*)">', nav[nav.find('menu-more__panel'):nav.find('</details>')] if 'menu-more__panel' in nav else ''):
        if path.startswith(u) and u not in ('/', '/en/'):
            nav = nav.replace(f'<a href="{u}">', f'<a href="{u}" aria-current="page">', 1).replace('<details class="menu-more">', '<details class="menu-more is-current">', 1)
            break
    ld_block = '  <!-- Structured data for search engines. -->\n  <script type="application/ld+json">\n' + json.dumps(ld, ensure_ascii=False, indent=2) + "\n  </script>\n"
    return top + ld_block + nav + '  <main id="top">\n' + main + "\n  </main>" + foot


def write(rel, content):
    full = os.path.join(ROOT, rel.strip("/"), "index.html")
    os.makedirs(os.path.dirname(full), exist_ok=True)
    open(full, "w", encoding="utf-8").write(content)


def crumbs(lang, items):
    return {"@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": n, "item": SITE + u} for i, (n, u) in enumerate(items)]}


def main():
    posts = [read_post(os.path.join(ROOT, "_blog/posts", f)) for f in sorted(os.listdir(os.path.join(ROOT, "_blog/posts"))) if f.endswith(".md")]
    by_slug = {p["slug"]: p for p in posts}
    home = {"es": "/", "en": "/en/"}
    for lang in ("es", "en"):
        cfg, other = L[lang], L["en" if lang == "es" else "es"]
        mine = sorted((p for p in posts if p["lang"] == lang), key=lambda p: p["date"], reverse=True)
        for p in mine:
            path = cfg["blog"] + p["slug"] + "/"
            other_path = other["blog"] + by_slug[p["pair"]]["slug"] + "/" if p.get("pair") in by_slug else other["blog"]
            words = len(re.findall(r"\w+", p["body"]))
            mins = max(1, round(words / 220))
            ld = {"@context": "https://schema.org", "@graph": [
                crumbs(lang, [("pleko", home[lang]), (cfg["label"], cfg["blog"]), (p["title"], path)]),
                {"@type": "BlogPosting", "headline": p["title"], "description": p["subtitle"], "datePublished": p["date"],
                 "inLanguage": lang, "keywords": ", ".join(tags_of(p)), "url": SITE + path, "mainEntityOfPage": SITE + path,
                 "author": {"@type": "Person", "name": cfg["by"], "url": SITE + home[lang]},
                 "publisher": {"@id": "https://pleko.es/#pleko"}, "image": SITE + ("/og-es.png" if lang == "es" else "/og-en.png")}]}
            main_html = f'''    <article class="post">
      <div class="wrap">
        <header class="post__head">
          <p class="section-label"><a href="{cfg["blog"]}">{cfg["label"]}</a></p>
          <h1 class="h2">{html.escape(p["title"])}</h1>
          <p class="lead">{inline(p["subtitle"])}</p>
          <p class="post__meta">{cfg["by"]} · <time datetime="{p["date"]}">{nice_date(p["date"], lang)}</time> · {mins} {cfg["mins"]}</p>
          <p class="post__tags">{tag_chips(tags_of(p))}</p>
        </header>
        <div class="post__body">
          {markdown(p["body"])}
        </div>
        <aside class="callout post__cta">
          <p class="section-label">{cfg["cta_label"]}</p>
          <h2 class="h3-display">{cfg["cta_h"]}</h2>
          <p>{cfg["cta_p"]}</p>
          <p><a href="{home[lang]}#{"reserva" if lang == "es" else "book"}" class="btn btn--primary">{cfg["cta_btn"]} <span class="arrow" aria-hidden="true">→</span></a></p>
        </aside>
        <p class="subpage-note"><a href="{cfg["blog"]}">{cfg["back"]}</a></p>
      </div>
    </article>'''
            write(path, page(lang, path, other_path, f'{p["title"]} | pleko', p["subtitle"], ld, main_html, og_type="article"))
        cards = "\n".join(f'''          <li data-tags="{" ".join(tag_id(t) for t in tags_of(p))}">
            <a class="latest-post" href="{cfg["blog"]}{p["slug"]}/">
              <span class="section-label"><time datetime="{p["date"]}">{nice_date(p["date"], lang)}</time></span>
              <span class="latest-post__title">{html.escape(p["title"])}</span>
              <span class="latest-post__sub">{inline(p["subtitle"])}</span>
              <span class="post__tags">{tag_chips(tags_of(p))}</span>
            </a>
          </li>''' for p in mine)
        all_tags = sorted({t for p in mine for t in tags_of(p)}, key=str.lower)
        filters = ('<div class="tag-filter" role="group" aria-label="' + cfg["filter_label"] + '">'
                   + f'<button type="button" class="tag-filter__btn" data-tag="" aria-pressed="true">{cfg["all_tags"]}</button>'
                   + "".join(f'<button type="button" class="tag-filter__btn" data-tag="{tag_id(t)}" aria-pressed="false">{html.escape(t)}</button>' for t in all_tags)
                   + "</div>") if all_tags else ""
        main_html = f'''    <section class="subpage-hero">
      <div class="wrap">
        <div class="section-head">
          <p class="section-label">{cfg["label"]}</p>
          <h1 class="h2">{cfg["index_h1"]}</h1>
          <p class="lead">{cfg["index_lead"]}</p>
        </div>
      </div>
    </section>
    <section class="subpage-block">
      <div class="wrap">
        {filters}
        <ul class="post-list">
{cards}
        </ul>
      </div>
    </section>'''
        ld = {"@context": "https://schema.org", "@graph": [crumbs(lang, [("pleko", home[lang]), (cfg["label"], cfg["blog"])]),
              {"@type": "Blog", "name": cfg["index_title"], "url": SITE + cfg["blog"], "inLanguage": lang, "publisher": {"@id": "https://pleko.es/#pleko"}}]}
        write(cfg["blog"], page(lang, cfg["blog"], other["blog"], cfg["index_title"], cfg["index_desc"], ld, main_html))
        if mine:  # homepage "Ideas" card shows the newest post
            p = mine[0]
            hp = os.path.join(ROOT, home[lang].strip("/"), "index.html")
            s = open(hp, encoding="utf-8").read()
            i = s.index("<!-- latest-post:start -->") + len("<!-- latest-post:start -->")
            j = s.index("        <!-- latest-post:end -->")
            card = f'''
        <a class="latest-post" href="{cfg["blog"]}{p["slug"]}/">
          <span class="section-label">{cfg["latest"]} · <time datetime="{p["date"]}">{nice_date(p["date"], lang)}</time></span>
          <span class="latest-post__title">{html.escape(p["title"])}</span>
          <span class="latest-post__sub">{inline(p["subtitle"])}</span>
        </a>
'''
            open(hp, "w", encoding="utf-8").write(s[:i] + card + s[j:])
    print("Built", len(posts), "posts")


if __name__ == "__main__":
    main()
