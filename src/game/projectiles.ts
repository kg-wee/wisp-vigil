import Phaser from "phaser";
import { PROJECTILE_RADIUS } from "./state";

const BOLT_SPEED = 220;
const PROJECTILE_KEY = "projectile";
const PLAYER_BOLT_TINT = 0xb8d8ff;

export interface BoltOptions {
  speed?: number;
  spread?: number;
  muzzleOffset?: number;
  tint?: number;
  displayScale?: number;
  depth?: number;
}

/** Physics group config shared by boss and archer bolt pools. */
export function createProjectileGroup(
  scene: Phaser.Scene
): Phaser.Physics.Arcade.Group {
  return scene.physics.add.group({
    classType: Phaser.Physics.Arcade.Sprite,
    defaultKey: PROJECTILE_KEY,
    maxSize: 160,
    runChildUpdate: false,
  });
}

export function fireBolt(
  _scene: Phaser.Scene,
  group: Phaser.Physics.Arcade.Group,
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  speed = BOLT_SPEED,
  spread = 0,
  muzzleOffset = 0,
  options: BoltOptions = {}
): Phaser.Physics.Arcade.Sprite | null {
  const dx = tx - sx;
  const dy = ty - sy;
  const angle = Math.atan2(dy, dx) + spread;
  const vx = Math.cos(angle) * speed;
  const vy = Math.sin(angle) * speed;

  const spawnX = sx + Math.cos(angle) * muzzleOffset;
  const spawnY = sy + Math.sin(angle) * muzzleOffset;

  const scale = options.displayScale ?? 1;
  const size = PROJECTILE_RADIUS * 2.2 * scale;

  const created = group.create(spawnX, spawnY, PROJECTILE_KEY);
  if (!created) return null;
  const proj = created as Phaser.Physics.Arcade.Sprite;
  proj.setActive(true);
  proj.setVisible(true);
  proj.setDisplaySize(size, size);
  proj.setDepth(options.depth ?? 5);
  proj.setRotation(angle + Math.PI / 2);
  if (options.tint !== undefined) {
    proj.setTint(options.tint);
  } else {
    proj.clearTint();
  }
  proj.setData("hitBoss", false);
  proj.setData("pierceRemaining", 0);
  proj.setCircle(PROJECTILE_RADIUS * scale);
  proj.setCollideWorldBounds(false);
  proj.setPushable(false);
  proj.setBounce(0);
  const body = proj.body as Phaser.Physics.Arcade.Body;
  body.allowGravity = false;

  proj.setVelocity(vx, vy);
  return proj;
}

/** Arcane bolt fired by the wisp (auto-aim). */
export function firePlayerBolt(
  scene: Phaser.Scene,
  group: Phaser.Physics.Arcade.Group,
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  speed: number,
  muzzleOffset: number,
  options: BoltOptions = {}
): Phaser.Physics.Arcade.Sprite | null {
  return fireBolt(scene, group, sx, sy, tx, ty, speed, options.spread ?? 0, muzzleOffset, {
    tint: PLAYER_BOLT_TINT,
    displayScale: 0.95,
    depth: 6,
    ...options,
  });
}

export function cullProjectiles(
  group: Phaser.Physics.Arcade.Group,
  bounds: { left: number; right: number; top: number; bottom: number },
  margin = 20
): void {
  group.children.each((child) => {
    const proj = child as Phaser.Physics.Arcade.Sprite;
    if (
      proj.x < bounds.left - margin ||
      proj.x > bounds.right + margin ||
      proj.y < bounds.top - margin ||
      proj.y > bounds.bottom + margin
    ) {
      proj.destroy();
    }
    return true;
  });
}
