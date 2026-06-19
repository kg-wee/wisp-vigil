# Wisp's Vigil

Wisp's Vigil is a compact **Phaser 3** medieval fantasy survival game. Guide an arcane wisp through a shrinking ward, dodge wraiths and Ember Archers, gather soul shards, choose power-ups, and survive the Balefire Lord's arrival.

Play on GitHub Pages:

https://kg-wee.github.io/wisp-vigil/

## Gameplay

- Survive a 90-second round while the ward closes in.
- Collect soul shards to gain glory and unlock power-up choices.
- Auto-fire arcane bolts at nearby enemies while you focus on movement.
- Manage vitality and plating pickups to stay alive.
- Face the Balefire Lord in the final phase.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:5173, then click or press **SPACE** to start.

## Controls

| Input | Action |
|-------|--------|
| WASD / arrows | Move |
| Mouse / touch | Move toward pointer |
| Q / Menu button | Resume, restart, mute, and inspect pickups |
| 1 / 2 / 3 | Choose a power-up |

## Build

```bash
npm run build
npm run preview
```

The production build is emitted to `dist/`.

## Deployment

The project deploys to GitHub Pages through `.github/workflows/deploy.yml`. Pushing to `main` runs the workflow, builds the Vite app, uploads `dist/`, and publishes the site.

GitHub Pages should be configured with **Source: GitHub Actions**.

## Project layout

```text
src/main.ts       # Phaser game bootstrap
src/scenes/       # Boot, menu, gameplay, and game-over scenes
src/game/         # Core rules, spawning, combat, pickups, and state
src/ui/           # HUD, menus, overlays, and visual presentation helpers
src/assets/       # Procedural textures, sprite helpers, and Web Audio
public/assets/    # Runtime image assets loaded by the game
docs/GDD.md       # Game design reference
```
