# Wisp's Vigil

A small **Phaser 3** medieval fantasy survival game — guide a wisp through balefire wraiths for 90 seconds, claim soul shards, choose weapon powers, and hold a ward.

Built as a **multi-agent-friendly** layout for Cursor (see `docs/GDD.md` and `.cursor/`).

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:5173 — click or **SPACE** to start.

## Controls

| Input | Action |
|--------|--------|
| WASD / arrows | Move |
| Mouse / touch | Move toward pointer |
| Q / Menu button | Resume, restart, mute, and inspect pickups |
| 1 / 2 / 3 | Choose a power-up |

## Project layout

```
src/game/       # rules, spawners, state, Phaser config
src/scenes/     # Boot, Menu, Game, GameOver
src/ui/         # HUD and overlay text
src/assets/     # procedural textures, Web Audio SFX/music
public/assets/  # source PNGs + packed entities.png
docs/GDD.md     # design doc for agents
.cursor/        # rules + subagents
```

## Next steps with Cursor agents

1. **Plan:** extend `docs/GDD.md` (power-ups, boss wave, etc.)
2. **game-logic subagent:** new hazard patterns in `src/game/`
3. **ui-polish subagent:** particles, screen shake, better menus
4. **Assets:** generate PNGs into `public/assets/sprites/`, load in `BootScene`
5. **Parallel agents:** try two UI themes on worktrees, merge the winner

## Spritesheet

Edit `public/assets/sprites/player.png` (and hazard/pickup), then repack:

```bash
npm run pack:sprites
```

Builds `entities.png` (256×192): 4-frame player pulse, 4-frame hazard spin, 2-frame pickup glow. Strips opaque backgrounds from source PNGs so all frames use transparency.

## Build

```bash
npm run build
npm run preview
```
