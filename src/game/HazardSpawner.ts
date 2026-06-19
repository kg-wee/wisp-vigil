import Phaser from "phaser";
import { createEntitySprite } from "../assets/sprites";
import { GameEvents } from "./events";
import type { ArenaBounds } from "./ArenaBounds";
import { HAZARD_RADIUS } from "./state";

type WraithVariant = "normal" | "charger" | "swarmer";
type MovementKind = "linear" | "sine" | "homing" | "charge";

interface HazardData {
  variant: WraithVariant;
  kind: MovementKind;
  radius: number;
  hp: number;
  baseVx: number;
  baseVy: number;
  sineOffset: number;
  homingStrength: number;
  chargeTimer: number;
  chargeVx: number;
  chargeVy: number;
  hatchTimer: number;
  speedMultiplier: number;
  slowTimer: number;
  slowMultiplier: number;
}

export class HazardSpawner {
  private readonly group: Phaser.Physics.Arcade.Group;
  private spawnTimer = 0;
  private difficulty = 1;
  private paused = false;

  constructor(private readonly scene: Phaser.Scene) {
    this.group = scene.physics.add.group({
      collideWorldBounds: true,
      bounceX: 1,
      bounceY: 1,
    });
  }

  get hazards(): Phaser.Physics.Arcade.Group {
    return this.group;
  }

  reset(): void {
    this.group.clear(true, true);
    this.spawnTimer = 0;
    this.difficulty = 1;
    this.paused = false;
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    if (paused) {
      this.group.clear(true, true);
    }
  }

  setDifficulty(elapsedSec: number): void {
    this.difficulty = 1 + Math.floor(elapsedSec / 18) * 0.28;
  }

  update(
    deltaMs: number,
    player: Phaser.Physics.Arcade.Sprite,
    arena: ArenaBounds
  ): void {
    if (!this.paused) {
      this.spawnTimer += deltaMs;
      const interval = Math.max(450, 1400 - this.difficulty * 120);
      if (this.spawnTimer >= interval) {
        this.spawnTimer = 0;
        this.spawn(arena);
      }
    }

    const body = player.body as Phaser.Physics.Arcade.Body;
    const px = body.center.x;
    const py = body.center.y;

    this.group.children.each((child) => {
      const hazard = child as Phaser.Physics.Arcade.Sprite;
      const data = hazard.getData("hazard") as HazardData;
      if (!data) return true;

      arena.clampSprite(hazard, data.radius);
      if (data.variant === "swarmer") {
        data.hatchTimer += deltaMs;
        if (data.hatchTimer >= 15000) {
          this.hatchSwarmer(hazard, data);
          return true;
        }
      }
      data.slowTimer = Math.max(0, data.slowTimer - deltaMs);
      const slow = data.slowTimer > 0 ? data.slowMultiplier : 1;
      this.applyVariantTint(hazard, data);

      const speed = (90 + this.difficulty * 25) * data.speedMultiplier * slow;
      if (data.kind === "sine") {
        const t = this.scene.time.now / 1000 + data.sineOffset;
        hazard.setVelocity(
          data.baseVx * speed,
          data.baseVy * speed + Math.sin(t * 4) * 55
        );
      } else if (data.kind === "charge") {
        data.chargeTimer += deltaMs;
        if (data.chargeTimer >= 1500) {
          data.chargeTimer = 0;
        }
        const dx = px - hazard.x;
        const dy = py - hazard.y;
        const len = Math.hypot(dx, dy) || 1;
        if (data.chargeTimer < 260) {
          data.chargeVx = dx / len;
          data.chargeVy = dy / len;
          hazard.setVelocity((dx / len) * 50, (dy / len) * 50);
        } else if (data.chargeTimer < 760) {
          const chargeSpeed =
            (260 + this.difficulty * 42) * data.speedMultiplier * slow;
          hazard.setVelocity(
            data.chargeVx * chargeSpeed,
            data.chargeVy * chargeSpeed
          );
        } else {
          const dx = px - hazard.x;
          const dy = py - hazard.y;
          const len = Math.hypot(dx, dy) || 1;
          hazard.setVelocity((dx / len) * 90, (dy / len) * 90);
        }
      } else if (data.kind === "homing") {
        const dx = px - hazard.x;
        const dy = py - hazard.y;
        const len = Math.hypot(dx, dy) || 1;
        hazard.setVelocity(
          (dx / len) * speed * data.homingStrength + data.baseVx * 30,
          (dy / len) * speed * data.homingStrength + data.baseVy * 30
        );
      } else {
        hazard.setVelocity(data.baseVx * speed, data.baseVy * speed);
      }
      hazard.setData("hazard", data);
      return true;
    });
  }

  private spawn(arena: ArenaBounds): void {
    const variant = this.rollVariant();
    const count = variant === "swarmer" ? 2 : 1;
    const origin = arena.randomEdgePoint(HAZARD_RADIUS);
    for (let i = 0; i < count; i++) {
      this.spawnOne(origin, variant, i);
    }
  }

  spawnBossWraith(origin: { x: number; y: number }): void {
    this.spawnOne(origin, "normal", 0);
  }

  damage(
    hazard: Phaser.Physics.Arcade.Sprite,
    amount: number
  ): { defeated: boolean; x: number; y: number } {
    const data = hazard.getData("hazard") as HazardData | undefined;
    const x = hazard.x;
    const y = hazard.y;
    if (!data) {
      hazard.destroy();
      return { defeated: true, x, y };
    }

    data.hp -= amount;
    if (data.hp <= 0) {
      hazard.destroy();
      return { defeated: true, x, y };
    }

    hazard.setData("hazard", data);
    this.scene.tweens.add({
      targets: hazard,
      alpha: 0.45,
      duration: 55,
      yoyo: true,
      repeat: 1,
    });
    return { defeated: false, x, y };
  }

  applySlow(
    hazard: Phaser.Physics.Arcade.Sprite,
    multiplier: number,
    durationMs: number
  ): void {
    if (durationMs <= 0 || multiplier >= 1) return;
    const data = hazard.getData("hazard") as HazardData | undefined;
    if (!data) return;
    data.slowMultiplier = Math.min(data.slowMultiplier, multiplier);
    data.slowTimer = Math.max(data.slowTimer, durationMs);
    hazard.setData("hazard", data);
    hazard.setTint(0x1a3f7a);
  }

  applyKnockback(
    hazard: Phaser.Physics.Arcade.Sprite,
    fromX: number,
    fromY: number,
    force: number
  ): void {
    if (force <= 0) return;
    const dx = hazard.x - fromX;
    const dy = hazard.y - fromY;
    const len = Math.hypot(dx, dy) || 1;
    hazard.setVelocity((dx / len) * force, (dy / len) * force);
  }

  private applyVariantTint(
    hazard: Phaser.Physics.Arcade.Sprite,
    data: HazardData
  ): void {
    if (data.slowTimer > 0) {
      hazard.setTint(0x1a3f7a);
      return;
    }
    if (data.variant === "charger") {
      hazard.setTint(0x66aaff);
    } else if (data.variant === "swarmer") {
      hazard.setTint(0x6ecf8a);
    } else {
      hazard.clearTint();
    }
  }

  private rollVariant(): WraithVariant {
    const roll = Phaser.Math.Between(1, 100);
    if (roll <= 18) return "swarmer";
    if (roll <= 43) return "charger";
    return "normal";
  }

  private spawnOne(
    origin: { x: number; y: number },
    variant: WraithVariant,
    offsetIndex: number,
    speedMultiplier = 1
  ): void {
    const angle = (Math.PI * 2 * offsetIndex) / 5;
    const clusterRadius = variant === "swarmer" ? 24 : 0;
    const x = origin.x + Math.cos(angle) * clusterRadius;
    const y = origin.y + Math.sin(angle) * clusterRadius;
    let vx = Phaser.Math.FloatBetween(-1, 1);
    let vy = Phaser.Math.FloatBetween(-1, 1);
    const len = Math.hypot(vx, vy) || 1;
    vx /= len;
    vy /= len;

    const kinds: MovementKind[] = ["linear", "sine", "homing"];
    const kind: MovementKind =
      variant === "charger" ? "charge" : Phaser.Utils.Array.GetRandom(kinds);
    const hazard = createEntitySprite(
      this.scene,
      x,
      y,
      "hazard"
    );
    const radius =
      variant === "charger"
        ? HAZARD_RADIUS * 1.25
        : variant === "swarmer"
          ? HAZARD_RADIUS * 0.8
          : HAZARD_RADIUS;
    hazard.setCircle(radius);
    hazard.setBounce(1);
    hazard.setCollideWorldBounds(true);
    if (variant === "charger") {
      hazard.setTint(0x66aaff);
      hazard.setScale(1.25);
    } else if (variant === "swarmer") {
      hazard.setTint(0x6ecf8a);
      hazard.setScale(0.8);
    }

    const data: HazardData = {
      variant,
      kind,
      radius,
      hp: variant === "charger" ? 3 : 1,
      baseVx: vx,
      baseVy: vy,
      sineOffset: Phaser.Math.FloatBetween(0, Math.PI * 2),
      homingStrength: kind === "homing" ? 0.55 : variant === "swarmer" ? 0.35 : 0,
      chargeTimer: variant === "charger" ? Phaser.Math.Between(0, 220) : 0,
      chargeVx: vx,
      chargeVy: vy,
      hatchTimer: 0,
      speedMultiplier,
      slowTimer: 0,
      slowMultiplier: 1,
    };
    hazard.setData("hazard", data);

    const speed =
      variant === "charger"
        ? (180 + this.difficulty * 34) * data.speedMultiplier
        : variant === "swarmer"
          ? (125 + this.difficulty * 28) * data.speedMultiplier
          : (110 + this.difficulty * 30) * data.speedMultiplier;
    hazard.setVelocity(vx * speed, vy * speed);
    this.group.add(hazard);
    this.scene.events.emit(GameEvents.HAZARD_SPAWN, hazard.x, hazard.y);
  }

  private hatchSwarmer(
    swarmer: Phaser.Physics.Arcade.Sprite,
    data: HazardData
  ): void {
    if (!swarmer.active) return;
    const origin = { x: swarmer.x, y: swarmer.y };
    const speedMultiplier = data.speedMultiplier * 1.1;
    swarmer.destroy();
    this.spawnOne(origin, "swarmer", 0, speedMultiplier);
    this.spawnOne(origin, "swarmer", 1, speedMultiplier);
  }
}
