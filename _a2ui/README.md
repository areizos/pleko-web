# A2UI renderer bundle

Builds `pruebalo/aventura/a2ui.js`, the file that draws A2UI screens on the hidden demo page `/pruebalo/aventura/`.
A2UI is Google's open format (https://a2ui.org, Apache 2.0) for an assistant to send screens (buttons, cards, forms) instead of only text.

Rebuild only when updating the renderer version: `npm install && npm run build`, then bump `a2ui.js?v=N` in `pruebalo/aventura/index.html`.

The live step of the demo is the n8n workflow "pleko.es demo: voice note to actions (A2UI)" on Hostinger (daily cap 150, origin pleko.es, execution data not saved).
