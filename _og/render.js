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
  noche: { css: `background:radial-gradient(120% 140% at 85% 30%, #0f4d4d 0%, #0b3d3d 55%, #082e2e 100%);`, dark: true, threads: ["#8ff6d0", "#4fb898", "#2f8f86", "#8ff6d0"] },
};

function rng(seed) { let s = seed * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); }

// A few soft threads on the right, different per card (seeded), echoing the logo line.
function threads(seed, colours, dark, minX = 700) {
  const r = rng(seed || 1);
  const cols = colours || ["#2f8f86", "#4fb898", "#006565", "#8ff6d0"];
  let out = "";
  for (let i = 0; i < 4; i++) {
    const y = 120 + i * 120 + (r() - 0.5) * 60;
    const a = (r() - 0.5) * 160, b = (r() - 0.5) * 160;
    const x0 = minX + r() * 120;
    out += `<path d="M${x0} ${y} C ${x0 + 140} ${y + a}, ${x0 + 300} ${y + b}, 1260 ${y + (r() - 0.5) * 120}" stroke="${cols[i % cols.length]}" stroke-width="3" fill="none" stroke-linecap="round" opacity="${dark ? 0.55 : 0.75}"/>`;
    const cx = Math.max(960, minX + 160) + r() * 100, cy = y + (a + b) / 4;
    out += `<circle cx="${cx}" cy="${cy}" r="7" fill="${cols[i % cols.length]}" opacity="${dark ? 0.8 : 0.9}"/>`;
  }
  const x = 1010 + r() * 60;
  out += `<path d="M${x} 0 C ${x + 60} 200, ${x - 60} 420, ${x + 40} 630" stroke="${dark ? "#8ff6d0" : "#bdc9c8"}" stroke-width="2" fill="none" opacity="${dark ? 0.35 : 0.8}"/>`;
  return `<svg class="threads" viewBox="0 0 1200 630" width="1200" height="630">${out}</svg>`;
}

const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;");

function html(c) {
  const bg = BG[c.bg] || BG.papel;
  const dark = !!bg.dark;
  const ink = dark ? "#ffffff" : "#006565", body = dark ? "#d6ece6" : "#3e4949", lab = dark ? "#8ff6d0" : "#006565";
  const logo = `<img class="logo" src="${f("pleko-logo.svg")}" />`;
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
      <img class="photo" src="${f("alex.jpg")}" />`;
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
.t-post{font-size:80px;line-height:1.08;margin-top:44px;max-width:900px;text-wrap:balance}
.t-home{font-size:86px;line-height:1.05;margin-top:56px}
.t-blog{font-size:84px;line-height:1.05;margin-top:40px;max-width:640px}
.t-serv{font-size:58px;line-height:1.1;margin-top:30px;max-width:760px}
.lead{font-size:30px;line-height:1.4;margin-top:24px;max-width:780px}
.lead.narrow{max-width:600px;font-size:28px}
.url{margin-top:auto;font:600 24px Inter;color:${lab};display:flex;align-items:center;gap:12px}
.logo{height:${dark ? 58 : 62}px;${dark ? "filter:brightness(0) invert(1);" : ""}}
.top .logo{height:88px}
.foot{margin-top:auto;display:flex;align-items:center;justify-content:space-between;gap:24px}
.who{display:flex;align-items:center;gap:18px}
.who img{width:84px;height:84px;border-radius:50%;filter:grayscale(1)}
.who b{display:block;font:600 26px Inter;color:${ink}}
.who i{display:block;font:400 22px Inter;font-style:normal;color:${body};margin-top:4px}
.name{font:600 26px Inter;color:${ink}}
.photo{position:absolute;right:80px;top:115px;width:400px;height:400px;border-radius:50%;object-fit:cover;object-position:50% 20%;border:6px solid ${dark ? "#8ff6d0" : "#006565"};filter:grayscale(1)}
.rows{list-style:none;margin-top:30px;max-width:820px}
.rows li{display:flex;justify-content:space-between;align-items:baseline;gap:24px;padding:16px 0;border-top:2px solid ${dark ? "rgba(143,246,208,.35)" : "#bdc9c8"};font:500 30px Inter;color:${dark ? "#fff" : "#1b1c1c"}}
.rows b{font-weight:700;color:${ink};white-space:nowrap}
.blog-only .threads{display:none}
</style></head><body class="${c.layout === "blog" ? "blog-only" : ""}">
${c.layout === "post" || c.layout === "home" ? threads(c.seed, bg.threads, dark, c.layout === "home" ? 1000 : 700) : ""}
<div class="card">${main}</div>
<script>
const t=document.getElementById("t");
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
