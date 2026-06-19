# Wisp's Vigil — Game Design Doc

## Concept
Medieval fantasy survival: guide an **arcane wisp** for **90 seconds**. The **ward** shrinks over time. Dodge melee wraiths and **Ember Archers**, weave through stone ruins, choose weapon powers as glory rises, then face the **Balefire Lord** in the final **30 seconds**.

## Player stats
- **Vitality:** 3 HP at start (death at 0).
- **Plating (armor):** 0 at start, max 3. Each hit consumes 1 plating before vitality.
- **Invulnerability:** ~1.2s after each hit.

## Controls
- **Keyboard:** WASD or arrows
- **Touch/mouse:** hold click/touch to steer
- **Auto-attack:** arcane bolts fire automatically at the nearest foe (boss → archer → wraith) within range
- **Q / Menu button:** open the in-run menu to resume, restart, mute, or inspect pickups collected
- **1 / 2 / 3:** choose a power-up when the upgrade rite opens

## Power-ups
- Glory thresholds open a paused 1-of-3 upgrade picker.
- First threshold is 75 glory; later thresholds grow progressively.
- The picker shows 3 choices rolled from five upgrade lines, each capped at level 3:
  **Starfire Velocity**, **Astral Volley**, **Dawnforge Impact**, **Runic Blast**,
  and **Cinderstep**.
- **Starfire Velocity:** sharply increases projectile speed.
- **Astral Volley:** increases volleys from 1 to 3 to 5 bolts.
- **Dawnforge Impact:** adds knockback; level 3 creates a golden piercing spear.
- **Runic Blast:** adds AOE splash with a visible impact circle.
- **Cinderstep:** increases movement speed; level 3 leaves a fire trail that lasts 2s and kills enemies.
- Maxed upgrade lines are shown as complete and cannot consume another choice.
- Gameplay pauses during the choice, then resumes after exactly one power is selected.

## Shrinking ward
- Arena inset grows with round progress (max ~130px per edge).
- Leaving the ward deals damage every 0.5s (same damage pipeline).
- Spawns stay inside the ward.

## Pickups (weighted spawn)
| Type | Effect |
|------|--------|
| Soul shard | +35 glory; during boss phase, 1 boss damage |
| Vitality | +1 HP (max 3) |
| Plating | +1 armor (max 3) |

Spawn uses obstacle clearance (`src/game/spawnPlacement.ts`).

## Enemies
- **Normal wraiths:** classic red melee wraiths with linear / sine / homing movement.
- **Chargers:** blue wraiths, 25% larger than normal, that briefly track, then charge directly toward the player with higher velocity. Chargers take 3 hits to kill.
- **Swarmers:** green wraiths, 20% smaller than normal, that naturally spawn in pairs. If one survives 15s, it hatches into two swarmers with 10% higher movement speed.
- **Ember Archer:** from 20s elapsed; strafes and shoots bolts every ~1.8s. Stops during boss phase.
- **Balefire Lord:** final 30s; 18 HP; moves faster, fires three-shot fan volleys, and frequently summons red wraiths. Soul shards during boss phase deal 1 damage each.

## Audio
- SFX and background music are generated with Web Audio after the first user gesture.
- Music uses modal medieval melody shapes with retro square/triangle-wave synth texture.
- The in-run menu mutes/unmutes both SFX and music.

## Win / lose
- **Win:** timer reaches 0 with lord dead or not active; or slay lord early (+150 glory).
- **Lose:** vitality reaches 0; or timer hits 0 while lord still lives.

## Architecture
| Area | Path |
|------|------|
| State | `src/game/state.ts` |
| Damage | `src/game/PlayerDamage.ts` |
| Player attack | `src/game/PlayerAttack.ts` |
| Ward shrink | `src/game/ArenaBounds.ts` |
| Pickups | `src/game/PickupSpawner.ts` |
| Melee | `src/game/HazardSpawner.ts` |
| Archers | `src/game/ArcherSpawner.ts` |
| Boss | `src/game/BossController.ts` |
| Bolts | `src/game/projectiles.ts` |
| Sprites | `public/assets/sprites/` + `npm run pack:sprites` |

## Spritesheet (`entities.png`, 4×6)
- Row 0: player (0–3)
- Row 1: hazard (4–7)
- Row 2: soul pickup (8–9)
- Row 3: vitality pickup (12–13)
- Row 4: plating pickup (16–17)
- Row 5: archer (20–23)

Separate: `boss.png`, `projectile.png`, `obstacle.png`
