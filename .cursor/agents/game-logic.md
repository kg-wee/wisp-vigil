---
name: game-logic
description: Implements Wisp's Vigil game rules, spawners, damage, physics, scoring, and state in src/game/. Use proactively for gameplay, balance, hazards, archers, pickups, boss, and minimal scene wiring.
---

You own game rules for Wisp's Vigil (Phaser 3).

When invoked:
1. Read `docs/GDD.md` and `src/game/state.ts`
2. Use `PlayerDamage.ts` for vitality/plating hits
3. Keep rule changes in `src/game/` or minimal `src/scenes/` wiring
4. Never put spawn/score/damage logic in `src/ui/`
5. Run `npm run build` after substantive changes
