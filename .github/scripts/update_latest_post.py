"""Put the newest Substack post (headline + subtitle) on the homepage.

Run by .github/workflows/latest-post.yml every Saturday. Reads the RSS feed
of areizos.substack.com and rewrites the block between
<!-- latest-post:start --> and <!-- latest-post:end --> in the Spanish and
English homepages. Leaves the files untouched if the feed can't be read.
"""
import html
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET

FEED = "https://areizos.substack.com/feed"
PAGES = {"index.html": "Último texto", "en/index.html": "Latest post"}
BLOCK = re.compile(r"(<!-- latest-post:start -->\n)(.*?)(\n\s*<!-- latest-post:end -->)", re.S)


def latest_post():
    req = urllib.request.Request(FEED, headers={"User-Agent": "pleko.es site updater"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        root = ET.fromstring(resp.read())
    item = root.find("./channel/item")
    if item is None:
        return None
    title = (item.findtext("title") or "").strip()
    subtitle = (item.findtext("description") or "").strip()
    link = (item.findtext("link") or "https://areizos.substack.com/").strip()
    subtitle = re.sub(r"<[^>]+>", "", html.unescape(subtitle)).strip()  # plain text only
    return title, subtitle, link


def card(label, title, subtitle, link):
    esc = html.escape
    lines = [
        f'        <a class="latest-post" href="{esc(link)}" target="_blank" rel="noopener" lang="es">',
        f'          <span class="section-label">{esc(label)}</span>',
        f'          <span class="latest-post__title">{esc(title)}</span>',
    ]
    if subtitle:
        lines.append(f'          <span class="latest-post__sub">{esc(subtitle)}</span>')
    lines.append("        </a>")
    return "\n".join(lines)


def main():
    try:
        post = latest_post()
    except Exception as exc:  # network or feed problem: keep the current card
        print(f"Could not read the feed: {exc}")
        return 0
    if not post or not post[0]:
        print("No post found in the feed.")
        return 0
    title, subtitle, link = post
    for path, label in PAGES.items():
        with open(path, encoding="utf-8") as f:
            text = f.read()
        new, n = BLOCK.subn(lambda m: m.group(1) + card(label, title, subtitle, link) + m.group(3), text)
        if n != 1:
            print(f"Markers not found in {path}")
            return 1
        if new != text:
            with open(path, "w", encoding="utf-8") as f:
                f.write(new)
            print(f"Updated {path}: {title}")
        else:
            print(f"{path} already up to date")
    return 0


if __name__ == "__main__":
    sys.exit(main())
