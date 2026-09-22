# pleko.es

Source for the pleko.es personal site. Plain HTML/CSS, no build step, no framework —
open `index.html` in a browser and that's the whole app.

## Files

```
index.html   the page content and structure (all of it — one file)
style.css    every color, font and layout rule
assets/      logo + favicon images
CNAME        tells GitHub Pages which custom domain to serve this under
```

## Editing

Open `index.html` and `style.css` in any text editor (VS Code is a good free
one if you don't already have one). Some starting points:

- **Change the wording** — just edit the text inside the HTML tags in
  `index.html`. Nothing will break as long as you don't delete a tag.
- **Change a color** — every color used on the site is defined once, at the
  top of `style.css` under `:root { ... }`. Change it there and it updates
  everywhere that color is used.
- **Add a new section** — copy one of the existing `<section>` blocks in
  `index.html` (e.g. the "About" section), change its content, and give it
  a new CSS class if you want it styled differently.

## Previewing changes locally

You don't need a server for a static site like this — just open the file:

```
open index.html          # macOS
# or double-click index.html in Finder
```

If a browser preview looks different from what you expect after an edit,
do a hard refresh (Cmd+Shift+R) — browsers aggressively cache CSS.

## Deploying

This site is meant to be hosted for free on **GitHub Pages**, serving the
custom domain **pleko.es**. See the setup steps Claude walked through in
chat for:

1. Creating the GitHub repository and pushing this code
2. Turning on GitHub Pages in the repo settings
3. Pointing pleko.es at GitHub Pages via DNS records at your registrar
4. Enabling HTTPS

Once that's done, pushing a new commit to the `main` branch (`git add`,
`git commit`, `git push`) automatically updates the live site within a
minute or two — no manual redeploy step.
