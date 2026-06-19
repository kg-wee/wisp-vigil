import Phaser from "phaser";
import type { ArcherSpawner } from "./ArcherSpawner";
import type { ArenaBounds } from "./ArenaBounds";
import type { BossController } from "./BossController";
import { GameEvents } from "./events";
import type { HazardSpawner } from "./HazardSpawner";
import {
  createProjectileGroup,
  cullProjectiles,
  firePlayerBolt,
} from "./projectiles";
import {
  PLAYER_AIM_RANGE,
  PLAYER_BOLT_SPEED,
  PLAYER_FIRE_INTERVAL_MS,
  PLAYER_RADIUS,
  type GameState,
} from "./state";

interface AimTarget {
  x: number;
  y: number;
}

export class PlayerAttack {
  readonly projectiles: Phaser.Physics.Arcade.Group;
  private shootTimer = PLAYER_FIRE_INTERVAL_MS * 0.5;

  constructor(private readonly scene: Phaser.Scene) {
    this.projectiles = createProjectileGroup(scene);
  }

  reset(): void {
    this.projectiles.clear(true, true);
    this.shootTimer = PLAYER_FIRE_INTERVAL_MS * 0.5;
  }

  update(
    deltaMs: number,
    player: Phaser.Physics.Arcade.Sprite,
    arena: ArenaBounds,
    hazards: HazardSpawner,
    archers: ArcherSpawner,
    boss: BossController,
    state: GameState
  ): void {
    this.shootTimer += deltaMs;
    cullProjectiles(this.projectiles, arena.rect);

    const target = this.findTarget(player, hazards, archers, boss, PLAYER_AIM_RANGE);
    if (!target) return;

    const dist = Math.hypot(target.x - player.x, target.y - player.y);
    if (dist > PLAYER_AIM_RANGE) return;
    if (this.shootTimer < PLAYER_FIRE_INTERVAL_MS) return;

    const count = state.upgrades.projectileCount;
    const spreadStep = count > 1 ? state.upgrades.spreadAngle : 0;
    const firstSpread = -spreadStep * (count - 1) * 0.5;
    let spawned = 0;
    for (let i = 0; i < count; i++) {
      const proj = firePlayerBolt(
        this.scene,
        this.projectiles,
        player.x,
        player.y,
        target.x,
        target.y,
        PLAYER_BOLT_SPEED + state.upgrades.boltSpeedBonus,
        PLAYER_RADIUS + 8,
        {
          spread: firstSpread + spreadStep * i,
          displayScale:
            state.upgrades.projectileDamageLevel >= 3
              ? 1.65
              : 0.95 + state.upgrades.boltDamage * 0.08,
          tint:
            state.upgrades.projectileDamageLevel >= 3 ? 0xf0d080 : undefined,
        }
      );
      if (!proj) continue;
      proj.setData("damage", state.upgrades.boltDamage);
      proj.setData("aoeRadius", state.upgrades.bulletAoeRadius);
      proj.setData("slowMultiplier", state.upgrades.slowMultiplier);
      proj.setData("slowDurationMs", state.upgrades.slowDurationMs);
      proj.setData("knockback", state.upgrades.knockback);
      proj.setData("pierceRemaining", state.upgrades.pierce);
      spawned += 1;
    }
    if (spawned === 0) return;
    this.shootTimer = 0;
    this.scene.events.emit(GameEvents.PLAYER_SHOOT, player.x, player.y);
  }

  private findTarget(
    player: Phaser.Physics.Arcade.Sprite,
    hazards: HazardSpawner,
    archers: ArcherSpawner,
    boss: BossController,
    maxRange: number
  ): AimTarget | null {
    const px = player.x;
    const py = player.y;
    const maxRangeSq = maxRange * maxRange;

    if (boss.isActive() && !boss.isDefeated() && boss.boss) {
      const d2 = (boss.boss.x - px) ** 2 + (boss.boss.y - py) ** 2;
      if (d2 <= maxRangeSq) {
        return { x: boss.boss.x, y: boss.boss.y };
      }
    }

    let nearestArcher: AimTarget | null = null;
    let archerDistSq = Infinity;
    archers.archerGroup.children.each((child) => {
      const archer = child as Phaser.Physics.Arcade.Sprite;
      if (!archer.active) return true;
      const d2 = (archer.x - px) ** 2 + (archer.y - py) ** 2;
      if (d2 <= maxRangeSq && d2 < archerDistSq) {
        archerDistSq = d2;
        nearestArcher = { x: archer.x, y: archer.y };
      }
      return true;
    });
    if (nearestArcher) return nearestArcher;

    let nearestHazard: AimTarget | null = null;
    let hazardDistSq = Infinity;
    hazards.hazards.children.each((child) => {
      const hazard = child as Phaser.Physics.Arcade.Sprite;
      if (!hazard.active) return true;
      const d2 = (hazard.x - px) ** 2 + (hazard.y - py) ** 2;
      if (d2 <= maxRangeSq && d2 < hazardDistSq) {
        hazardDistSq = d2;
        nearestHazard = { x: hazard.x, y: hazard.y };
      }
      return true;
    });

    return nearestHazard;
  }
}
