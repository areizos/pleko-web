"""Put the newest Substack post (headline + subtitle) on the homepage.

Run by .github/workflows/latest-post.yml every Saturday. Reads the RSS feed
of areizos.substack.com and rewrites the block between
<!-- latest-post:start --> and <!-- latest-post:end --> in the Spanish and
English homepages. Leaves the files untouched if the feed can't be read.
"""
import html
import re
import sys
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

FEED = "https://areizos.substack.com/feed"
PAGES = {"index.html": "Último texto", "en/index.html": "Latest post"}
BLOCK = re.compile(r"(<!-- latest-post:start -->\n)(.*?)(\n\s*<!-- latest-post:end -->)", re.S)


# Substack turns away requests that don't look like a browser.
HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36",
    "Accept": "application/rss+xml, application/xml;q=0.9, application/json;q=0.8, */*;q=0.5",
    "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
}
API = "https://areizos.substack.com/api/v1/archive?sort=new&limit=1"


def fetch(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read()


# Substack's firewall often blocks GitHub's servers, so if the feed and the
# API both refuse, the feed is read through rss2json.com, a free RSS reader.
RSS2JSON = "https://api.rss2json.com/v1/api.json?rss_url=" + urllib.parse.quote(FEED, safe="")


def latest_post():
    for source in (from_feed, from_api, from_rss2json):
        try:
            return source()
        except Exception as exc:
            print(f"{source.__name__} failed: {exc}")
    raise RuntimeError("no source worked")


def from_rss2json():
    import json
    data = json.loads(fetch(RSS2JSON))
    if data.get("status") != "ok" or not data.get("items"):
        raise RuntimeError(data.get("message") or "no items")
    item = data["items"][0]
    subtitle = re.sub(r"<[^>]+>", "", html.unescape(item.get("description") or "")).strip()
    return (item.get("title") or "").strip(), subtitle, item.get("link") or "https://areizos.substack.com/"


def from_api():
    import json
    posts = json.loads(fetch(API))
    if not posts:
        return None
    p = posts[0]
    return (p.get("title") or "").strip(), (p.get("subtitle") or "").strip(), p.get("canonical_url") or "https://areizos.substack.com/"


def from_feed():
    root = ET.fromstring(fetch(FEED))
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
