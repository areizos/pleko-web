# pleko-web

Static bilingual site (Spanish at `/`, English at `/en/`) on GitHub Pages.

## Tracking Redirects & Analytics (/v/)

- **Stack & philosophy:** pleko.es runs on GitHub Pages with cookieless Umami analytics (no GA4, no cookie banners). All campaign/channel attribution uses static HTML redirects inside `/v/` with UTM parameters, sessionStorage form injection (in `site.js`), and granular Umami events.
- **Protection:** Never delete or move the `/v/` folder during repository cleanups or refactors. `robots.txt` must NOT disallow `/v/`: Google can only obey the `noindex, nofollow` tag on each redirect page if it is allowed to read it. No page may link to `/v/` except the outbound `/v/areizos/` link.
- **Link maintenance:** Whenever any page slug or route on pleko.es or pleko.es/en/ is renamed or restructured, automatically check `/v/` and update any redirect `index.html` pointing to the old URL.
- **Proactive tracking suggestions:** Whenever we build a new page, campaign, lead magnet, external integration, or outbound/inbound link that isn't covered by the existing `/v/` slugs, proactively suggest adding a new `/v/` redirect category (and matching UTM tags) so we don't miss attribution data.
- **Naming convention for new links:** Always generate a static HTML redirect using the standard meta noindex + meta refresh + `window.location.replace` template (copy any existing `/v/*/index.html`):
  - Spanish destinations: `/v/<slug>/index.html` -> `https://pleko.es/...`
  - English destinations: `/v/en/<slug>/index.html` -> `https://pleko.es/en/...`
  - Outbound destinations: `/v/<slug>/index.html` -> `https://...`
- **Umami events** (all in `site.js`): `click-diagnostico`, `click-contacto`, `click-whatsapp` (each with a `location` property: header, hero, services, case-study, contact, faq, footer…), `toggle-language`, `expand-faq`, `click-founder-bio`, `scroll-depth` (50% / 90%). Any link to areizos.com must go through `/v/areizos/` with `target="_blank" rel="noopener"`.
- **Cache-busting:** bump `site.js?v=N` on every page when `site.js` changes.
