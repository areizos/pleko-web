// Renders the social preview images (og:image, 1200x630) from _og/cards.json.
// Run from the repo root:  node _og/render.js [cards.json]   (python3 _blog/build.py runs it for you)
// Each card: {out, layout: home|blog|services|post, bg, lang, label, title, lead, rows, seed}
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const f = (p) => "file://" + path.join(ROOT, p);

// Backgrounds. "dark" ones flip the text to light.
const BG = {
  papel: { css: `background:#f6f3f2 url(${f("paper.png")});` },
  lino: { css: `background:#eef7f3 url(${f("_og/2-lino.png")}) center/cover;` },
  puntos: { css: `background:#fcf9f8 url(${f("_og/3-puntos.png")}) center/cover;` },
  cuadricula: { css: `background:#fcf9f8 url(${f("_og/4-cuadricula.png")}) center/cover;` },
  brillo: { css: `background:#ffffff url(${f("_og/5-brillo.png")}) center/cover;` },
  menta: { css: `background:#e1f5ee url(${f("paper.png")});`, threads: ["#006565", "#2f8f86", "#4fb898", "#0b3d3d"] },
  salvia: { css: `background:#dcefe9 url(${f("paper.png")});`, threads: ["#006565", "#2f8f86", "#0b3d3d", "#4fb898"] },
  "menta-puntos": { css: `background:radial-gradient(circle, rgba(0,101,101,.16) 1.6px, transparent 2px) 0 0/28px 28px, #e1f5ee;`, threads: ["#006565", "#2f8f86", "#4fb898", "#0b3d3d"] },
  "papel-rejilla": { css: `background:linear-gradient(rgba(0,101,101,.07) 1px, transparent 1px) 0 0/40px 40px, linear-gradient(90deg, rgba(0,101,101,.07) 1px, transparent 1px) 0 0/40px 40px, #f6f3f2 url(${f("paper.png")});` },
  teal: { css: `background:linear-gradient(135deg, #007070 0%, #006565 50%, #005656 100%);`, dark: true, threads: ["#8ff6d0", "#dcefe9", "#4fb898", "#8ff6d0"] },
  "noche-rejilla": { css: `background:linear-gradient(rgba(143,246,208,.06) 1px, transparent 1px) 0 0/40px 40px, linear-gradient(90deg, rgba(143,246,208,.06) 1px, transparent 1px) 0 0/40px 40px, #0b3d3d;`, dark: true, threads: ["#8ff6d0", "#4fb898", "#2f8f86", "#8ff6d0"] },
  // Wider palette for cards only (not the website), 18 Nov 2026. Each keeps the burnt orange node.
  arena: { css: `background:#efe7dc url(${f("paper.png")});`, threads: ["#006565", "#8a6a4a", "#2f8f86", "#0b3d3d"] },
  oliva: { css: `background:#e8eadc url(${f("paper.png")});`, ink: "#3d4a26", lab: "#3d4a26", body: "#4a5040", threads: ["#5f6f3a", "#8a9a5b", "#3d4a26", "#006565"] },
  marino: { css: `background:radial-gradient(120% 140% at 85% 30%, #1d2f52 0%, #16243f 60%, #101a30 100%);`, dark: true, lab: "#a9c5e8", body: "#d3dcec", threads: ["#a9c5e8", "#8ff6d0", "#6f8fbf", "#a9c5e8"] },
  pizarra: { css: `background:radial-gradient(120% 140% at 85% 30%, #33383b 0%, #272b2e 60%, #1e2123 100%);`, dark: true, lab: "#e9dcc9", body: "#d9d6d0", threads: ["#e9dcc9", "#8ff6d0", "#9aa3a6", "#e9dcc9"] },
  ciruela: { css: `background:radial-gradient(120% 140% at 85% 30%, #4a2a43 0%, #3b2235 60%, #2d1a29 100%);`, dark: true, lab: "#f0cfe0", body: "#ead8e2", threads: ["#f0cfe0", "#c99ab6", "#8ff6d0", "#f0cfe0"] },
  noche: { css: `background:radial-gradient(120% 140% at 85% 30%, #0f4d4d 0%, #0b3d3d 55%, #082e2e 100%);`, dark: true, threads: ["#8ff6d0", "#4fb898", "#2f8f86", "#8ff6d0"] },
};

function rng(seed) { let s = seed * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); }

// Threads: the logo's line, in a different shape on every card. Styles:
// flow (curves from the right), angular (square, circuit-like from the right), left (enter from the
// left edge; Alex dropped it 18 Nov, "looks like sheet music"), knot (threads meeting in one node), top (angular, dropping from the top edge),
// weave (vertical threads crossing over and under), bottom (square, rising from the bottom edge),
// corner (nested square threads from the right edge turning down). Alex prefers the square (90 degree) ones. One or two nodes are always burnt orange.
const ORANGE = "#cc5500";
function threads(seed, colours, dark, style = "flow", minX = 700, band = null) {
  const r = rng(seed || 1);
  const cols = colours || ["#2f8f86", "#4fb898", "#006565", "#8ff6d0"];
  const op = dark ? 0.6 : 0.8;
  const paths = [], nodes = [];
  const line = (d, c, w = 3) => paths.push(`<path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="${op}"/>`);
  if (style === "angular") {
    // band = [top, bottom]: lay the square threads in a horizontal strip (used under the homepage text)
    const n = band ? 3 : 4;
    for (let i = 0; i < n; i++) {
      const y = band ? band[0] + i * (band[1] - band[0]) / 2 : 100 + i * 105 + (r() - 0.5) * 30, x1 = minX + 60 + r() * 140, x2 = x1 + 90 + r() * 120;
      const dy = (band ? (i === n - 1 ? -1 : 1) * (22 + r() * 14) : (r() < 0.5 ? -1 : 1) * (40 + r() * 50)), k = band ? 11 : 18;
      line(`M${x1 - 60} ${y} H${x2 - k} Q${x2} ${y} ${x2} ${y + Math.sign(dy) * k} V${y + dy - Math.sign(dy) * k} Q${x2} ${y + dy} ${x2 + k} ${y + dy} H1240`, cols[i % 4]);
      nodes.push([x1 - 60, y, cols[i % 4]], [x2, y + dy / 2, cols[(i + 1) % 4]]);
    }
  } else if (style === "top") {
    for (let i = 0; i < 4; i++) {
      const x = minX + 200 + i * 80 + (r() - 0.5) * 24, y1 = 120 + r() * 160, y2 = y1 + 110 + r() * 120;
      const dx = 50 + r() * 50, k = 16;
      line(`M${x} -20 V${y1 - k} Q${x} ${y1} ${x + k} ${y1} H${x + dx - k} Q${x + dx} ${y1} ${x + dx} ${y1 + k} V${y2}`, cols[i % 4]);
      nodes.push([x + dx, y2, cols[i % 4]], [x + dx / 2, y1, cols[(i + 2) % 4]]);
    }
  } else if (style === "knot") {
    // Threads come in from the right and top edges and meet in one node, then leave as a single line.
    const kx = minX + 200 + r() * 40, ky = 330 + r() * 40;
    const starts = [[1240, 40 + r() * 50], [1240, 250 + r() * 50], [1240, 470 + r() * 40], [kx + 60 + r() * 60, -20]];
    starts.forEach(([x, y], i) => {
      line(`M${x} ${y} C ${(x + kx) / 2 + (r() - 0.5) * 80} ${y}, ${kx + 60} ${ky + (r() - 0.5) * 60}, ${kx} ${ky}`, cols[i % 4]);
      nodes.push([x * 0.25 + kx * 0.75 + (r() - 0.5) * 20, y * 0.35 + ky * 0.65, cols[i % 4]]);
    });
    line(`M${kx} ${ky} C ${kx - 80} ${ky + 30}, ${kx - 120} ${ky + 120}, ${kx - 60} 660`, cols[0], 3.5);
    nodes.push([kx, ky, cols[0]]);
  } else if (style === "bottom") {
    // Square threads rising from the bottom edge, stepping right at 90 degrees (kept left of the logo).
    for (let i = 0; i < 4; i++) {
      const x = minX + 30 + i * 60 + (r() - 0.5) * 16, y1 = 380 - i * 50 - r() * 60, y2 = y1 - 90 - r() * 90;
      const dx = 50 + r() * 60, k = 16;
      line(`M${x} 660 V${y1 + k} Q${x} ${y1} ${x + k} ${y1} H${x + dx - k} Q${x + dx} ${y1} ${x + dx} ${y1 - k} V${y2}`, cols[i % 4]);
      nodes.push([x + dx, y2, cols[i % 4]], [x, y1 + 60 + r() * 40, cols[(i + 2) % 4]]);
    }
  } else if (style === "corner") {
    // Nested square threads entering from the right edge and turning down at 90 degrees.
    for (let i = 0; i < 4; i++) {
      const y = 70 + i * 55 + r() * 20, x = 1150 - i * 85 - r() * 30, y2 = y + 150 + r() * 120, k = 18;
      line(`M1240 ${y} H${x + k} Q${x} ${y} ${x} ${y + k} V${y2}`, cols[i % 4]);
      nodes.push([x, y2, cols[i % 4]], [x + 40 + r() * 30, y, cols[(i + 1) % 4]]);
    }
  } else if (style === "weave") {
    const xs = [0, 1, 2, 3].map((i) => minX + 150 + i * 85 + (r() - 0.5) * 20);
    xs.forEach((x, i) => { const w = 30 + r() * 20; line(`M${x} -20 C ${x + w} 160, ${x - w} 420, ${x + w / 2} 650`, cols[i % 4]); });
    for (let j = 0; j < 3; j++) {
      const y = 150 + j * 150 + (r() - 0.5) * 40;
      line(`M${minX + 80} ${y} C ${minX + 260} ${y - 40}, ${minX + 380} ${y + 40}, 1240 ${y - 10}`, cols[(j + 1) % 4], 2.5);
      nodes.push([xs[(j + 1) % 4], y, cols[j % 4]]);
    }
  } else {
    for (let i = 0; i < 4; i++) {
      const y = 100 + i * 110 + (r() - 0.5) * 40, a = (r() - 0.5) * 160, b = (r() - 0.5) * 160, x0 = minX + r() * 120;
      line(`M${x0} ${y} C ${x0 + 140} ${y + a}, ${x0 + 300} ${y + b}, 1260 ${y + (r() - 0.5) * 120}`, cols[i % 4]);
      nodes.push([Math.max(960, minX + 160) + r() * 100, y + (a + b) / 4, cols[i % 4]]);
    }
    const x = 1010 + r() * 60;
    paths.push(`<path d="M${x} 0 C ${x + 60} 200, ${x - 60} 420, ${x + 40} 630" stroke="${dark ? "#8ff6d0" : "#bdc9c8"}" stroke-width="2" fill="none" opacity="${dark ? 0.35 : 0.8}"/>`);
  }
  // Burnt orange: one node always, a second on some cards. Kept tiny.
  const oi = Math.floor(r() * nodes.length), oj = r() < 0.5 ? (oi + 2) % nodes.length : -1;
  const dots = nodes.map(([x, y, c], i) => {
    const o = i === oi || i === oj;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${o ? 8 : 6.5}" fill="${o ? ORANGE : c}"${o ? "" : ` opacity="${dark ? 0.85 : 0.95}"`}/>`;
  }).join("");
  return `<svg class="threads" viewBox="0 0 1200 630" width="1200" height="630">${paths.join("")}${dots}</svg>`;
}

const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;");

function html(c) {
  const bg = BG[c.bg] || BG.papel;
  const dark = !!bg.dark;
  const ink = bg.ink || (dark ? "#ffffff" : "#006565"), body = bg.body || (dark ? "#d6ece6" : "#3e4949"), lab = bg.lab || (dark ? "#8ff6d0" : "#006565");
  // On dark backgrounds the teal letters turn white; the orange dot and mint line stay.
  const svg = fs.readFileSync(path.join(ROOT, "pleko-logo.svg"), "utf8");
  const logoSrc = dark ? "data:image/svg+xml;base64," + Buffer.from(svg.replace(/#1f5f5f/gi, "#ffffff")).toString("base64") : f("pleko-logo.svg");
  const logo = `<img class="logo" src="${logoSrc}" />`;
  const who = `<div class="who"><img src="${f("alex-avatar.jpg")}" /><span><b>Alexandros Reïzos</b><i>pleko.es</i></span></div>`;
  let main = "";
  if (c.layout === "home") {
    main = `<div class="top">${logo}</div>
      <h1 class="t-home">${esc(c.title)}</h1><p class="lead">${esc(c.lead)}</p>
      <p class="url"><span class="dot"></span>pleko.es</p>`;
  } else if (c.layout === "blog") {
    main = `<p class="label"><span class="dot"></span>${esc(c.label)}</p>
      <h1 class="t-blog">${esc(c.title)}</h1><p class="lead narrow">${esc(c.lead)}</p>
      <div class="foot"><span class="name">Alexandros Reïzos</span>${logo}</div>
      <img class="photo" src="${f("alex.jpg")}" />
      <svg class="threads" viewBox="0 0 1200 630" width="1200" height="630"><path d="M560 600 C 700 590, 690 470, 779 456" stroke="${lab}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/><circle cx="1061" cy="174" r="11" fill="#cc5500"/><circle cx="779" cy="456" r="7" fill="${lab}"/></svg>`;
  } else if (c.layout === "services") {
    main = `<p class="label"><span class="dot"></span>${esc(c.label)}</p>
      <h1 class="t-serv">${esc(c.title)}</h1>
      <ul class="rows">${(c.rows || []).map(([n, p]) => `<li><span>${esc(n)}</span><b>${esc(p)}</b></li>`).join("")}</ul>
      <div class="foot">${logo}</div>`;
  } else {
    main = `<p class="label"><span class="dot"></span>${esc(c.label)}</p>
      <h1 class="t-post" id="t">${esc(c.title)}</h1>
      <div class="foot">${who}${logo}</div>`;
  }
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Inter;font-weight:400 700;src:url(${f("fonts/inter-latin.woff2")})}
@font-face{font-family:Literata;font-weight:400 700;src:url(${f("fonts/literata-latin.woff2")})}
@font-face{font-family:Literata;font-weight:400 700;src:url(${f("fonts/literata-greek.woff2")});unicode-range:U+0370-03FF}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1200px;height:630px;overflow:hidden}
body{${bg.css}font-family:Inter,sans-serif;color:${body};position:relative}
.threads{position:absolute;inset:0}
.card{position:absolute;inset:0;padding:64px 80px;display:flex;flex-direction:column}
.label{font:600 22px/1 Inter;letter-spacing:.14em;text-transform:uppercase;color:${lab};display:flex;align-items:center;gap:12px}
.dot{width:12px;height:12px;border-radius:50%;background:#cc5500;display:inline-block}
h1{font-family:Literata,serif;font-weight:600;color:${ink};letter-spacing:-.01em}
.t-post{font-size:80px;line-height:1.08;margin-top:44px;max-width:720px;text-wrap:balance}
.t-home{font-size:74px;line-height:1.05;margin-top:56px}
.t-blog{font-size:84px;line-height:1.05;margin-top:40px;max-width:640px}
.t-serv{font-size:58px;line-height:1.1;margin-top:30px;max-width:760px}
.lead{font-size:30px;line-height:1.4;margin-top:24px;max-width:720px}
.t-home + .lead{font-size:27px;max-width:700px}
.lead.narrow{max-width:600px;font-size:28px}
.url{margin-top:auto;font:600 24px Inter;color:${lab};display:flex;align-items:center;gap:12px}
.logo{height:62px}
.top .logo{height:88px}
.foot{margin-top:auto;display:flex;align-items:center;justify-content:space-between;gap:24px}
.who{display:flex;align-items:center;gap:18px}
.who img{width:84px;height:84px;border-radius:50%;filter:grayscale(1)}
.who b{display:block;font:600 26px Inter;color:${ink}}
.who i{display:block;font:400 22px Inter;font-style:normal;color:${body};margin-top:4px}
.name{font:600 26px Inter;color:${ink}}
.photo{position:absolute;right:80px;top:115px;width:400px;height:400px;border-radius:50%;object-fit:cover;object-position:50% 20%;border:6px solid ${lab};filter:grayscale(1)}
.rows{list-style:none;margin-top:30px;max-width:820px}
.rows li{display:flex;justify-content:space-between;align-items:baseline;gap:24px;padding:16px 0;border-top:2px solid ${dark ? "rgba(143,246,208,.35)" : "#bdc9c8"};font:500 30px Inter;color:${dark ? "#fff" : "#1b1c1c"}}
.rows b{font-weight:700;color:${ink};white-space:nowrap}

</style></head><body class="${c.layout === "blog" ? "blog-only" : ""}">
${c.layout !== "blog" ? threads(c.seed, bg.threads, dark, c.style || "flow", c.layout === "home" ? 820 : c.layout === "services" ? 780 : 780, null) : ""}
<div class="card">${main}</div>
<script>
const t=document.getElementById("t");
const h=document.querySelector(".t-home");
if(h){h.style.whiteSpace="nowrap";h.style.alignSelf="flex-start";let s=74;while(h.offsetWidth>700&&s>50){s-=2;h.style.fontSize=s+"px";}
  // long titles: wrap onto two balanced lines instead of shrinking past 50px
  if(h.offsetWidth>700){h.style.whiteSpace="normal";h.style.textWrap="balance";h.style.maxWidth="700px";h.style.fontSize="60px";h.style.marginTop="40px";}}
if(t){let s=80;while(t.offsetHeight>300&&s>48){s-=2;t.style.fontSize=s+"px";}}
</script></body></html>`;
}

(async () => {
  const cards = JSON.parse(fs.readFileSync(process.argv[2] || path.join(__dirname, "cards.json"), "utf8"));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  for (const c of cards) {
    const tmp = path.join(__dirname, ".tmp.html");
    fs.writeFileSync(tmp, html(c));
    await page.goto("file://" + tmp);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(150);
    const out = path.isAbsolute(c.out) ? c.out : path.join(ROOT, c.out);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await page.screenshot({ path: out });
    fs.unlinkSync(tmp);
    console.log("wrote", c.out);
  }
  await browser.close();
})();
