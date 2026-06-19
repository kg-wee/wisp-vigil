import Phaser from "phaser";
import { createArcherSprite } from "../assets/sprites";
import { GameEvents } from "./events";
import { createProjectileGroup, cullProjectiles, fireBolt } from "./projectiles";
import type { ArenaBounds } from "./ArenaBounds";
import {
  ARCHER_RADIUS,
  ARCHER_SHOOT_INTERVAL_MS,
  ARCHER_SPAWN_AFTER_SEC,
} from "./state";

export class ArcherSpawner {
  private readonly archers: Phaser.Physics.Arcade.Group;
  readonly projectiles: Phaser.Physics.Arcade.Group;
  private spawnTimer = 0;
  private paused = false;
  private enabled = false;

  constructor(private readonly scene: Phaser.Scene) {
    this.archers = scene.physics.add.group({
      collideWorldBounds: true,
      bounceX: 0.8,
      bounceY: 0.8,
    });
    this.projectiles = createProjectileGroup(scene);
  }

  get archerGroup(): Phaser.Physics.Arcade.Group {
    return this.archers;
  }

  reset(): void {
    this.archers.clear(true, true);
    this.projectiles.clear(true, true);
    this.spawnTimer = 0;
    this.paused = false;
    this.enabled = false;
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    if (paused) {
      this.archers.clear(true, true);
      this.projectiles.clear(true, true);
    }
  }

  update(
    deltaMs: number,
    elapsedSec: number,
    player: Phaser.Physics.Arcade.Sprite,
    arena: ArenaBounds
  ): void {
    if (elapsedSec >= ARCHER_SPAWN_AFTER_SEC) {
      this.enabled = true;
    }
    if (!this.enabled || this.paused) return;

    this.spawnTimer += deltaMs;
    const interval = 3200;
    if (this.spawnTimer >= interval && this.archers.countActive() < 4) {
      this.spawnTimer = 0;
      this.spawn(arena);
    }

    const px = player.x;
    const py = player.y;
    const r = arena.rect;

    this.archers.children.each((child) => {
      const archer = child as Phaser.Physics.Arcade.Sprite;
      const data = archer.getData("archer") as { shootTimer: number };
      if (!data) return true;

      arena.clampSprite(archer, ARCHER_RADIUS);

      const dx = px - archer.x;
      const dy = py - archer.y;
      const len = Math.hypot(dx, dy) || 1;
      archer.setVelocity((dx / len) * 55, (dy / len) * 55);

      data.shootTimer += deltaMs;
      if (data.shootTimer >= ARCHER_SHOOT_INTERVAL_MS) {
        data.shootTimer = 0;
        fireBolt(
          this.scene,
          this.projectiles,
          archer.x,
          archer.y,
          px,
          py,
          240,
          Phaser.Math.FloatBetween(-0.08, 0.08),
          ARCHER_RADIUS + 6
        );
        this.scene.events.emit(GameEvents.BOSS_SHOOT, archer.x, archer.y);
      }
      archer.setData("archer", data);
      return true;
    });

    cullProjectiles(this.projectiles, r);
  }

  private spawn(arena: ArenaBounds): void {
    const { x, y } = arena.randomEdgePoint(ARCHER_RADIUS);
    const archer = createArcherSprite(this.scene, x, y);
    archer.setCircle(ARCHER_RADIUS);
    archer.setCollideWorldBounds(true);
    archer.setBounce(0.9);
    archer.setData("archer", { shootTimer: ARCHER_SHOOT_INTERVAL_MS * 0.5 });
    this.archers.add(archer);
    this.scene.events.emit(GameEvents.ARCHER_SPAWN, x, y);
  }
}
