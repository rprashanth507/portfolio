# Prashanth Reddy — Portfolio

A game-menu style personal portfolio for **Prashanth Reddy**, Data Engineer & Data Analyst.

Visitors land on a "press X / tap to continue" start screen, then enter a HUD-style
menu with a player card, background music, and keyboard + mouse + touch navigation
across sections (Home, About, Skills, Experience, Education, Projects, Contact).

## Tech

Plain static site — no build step, no framework.

- `index.html` — markup and all content
- `css/styles.css` — theme and layout
- `js/main.js` — entry flow, menu navigation, synthesized UI sounds, ambient music, particle background
- `assets/` — photo, banner, music track, favicon

## Run locally

Any static server works, e.g.:

```bash
python -m http.server 5173
```

Then open http://localhost:5173.

## Controls

- **X / Enter / Space / tap** — enter from the start screen
- **↑ ↓ (or ← →)** — move menu selection · **Enter** — open section
- **1–7** — jump straight to a section
- **M** — toggle music · **Esc** — back to Home

## Deploy (GitHub Pages)

Pushed to GitHub and served via Pages from the `main` branch root. `.nojekyll`
tells Pages to serve files as-is (no Jekyll processing).

## Credits

- Background music (a small playlist): "Drawings" by Nikita Kondrashev, plus
  "Soft Piano", "Nostalgic Piano", "Minimal Piano", "Piano" (Pixabay). Viewers can skip to
  the next track with the **Next** button or the `N` key; tracks auto-advance and loop.
- UI sound effects: synthesized in-browser via the Web Audio API.
