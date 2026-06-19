import Phaser from "phaser";
import {
  ARENA_SHRINK_MARGIN_MAX,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  roundProgress,
} from "./state";

export interface ArenaRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export class ArenaBounds {
  private margin = 0;
  private borderGfx!: Phaser.GameObjects.Graphics;
  private dangerGfx!: Phaser.GameObjects.Graphics;

  constructor(private readonly scene: Phaser.Scene) {
    this.dangerGfx = scene.add.graphics().setDepth(3);
    this.borderGfx = scene.add.graphics().setDepth(4);
  }

  get rect(): ArenaRect {
    const left = this.margin;
    const top = this.margin;
    const right = WORLD_WIDTH - this.margin;
    const bottom = WORLD_HEIGHT - this.margin;
    return {
      left,
      top,
      right,
      bottom,
      width: right - left,
      height: bottom - top,
      centerX: (left + right) / 2,
      centerY: (top + bottom) / 2,
    };
  }

  update(elapsedSec: number): void {
    const progress = roundProgress(elapsedSec);
    const eased = progress * progress;
    this.margin = ARENA_SHRINK_MARGIN_MAX * eased;
    this.applyPhysicsBounds();
    this.drawVisuals(progress);
  }

  contains(x: number, y: number, padding = 0): boolean {
    const r = this.rect;
    return (
      x >= r.left + padding &&
      x <= r.right - padding &&
      y >= r.top + padding &&
      y <= r.bottom - padding
    );
  }

  clampSprite(sprite: Phaser.Physics.Arcade.Sprite, radius: number): void {
    const r = this.rect;
    sprite.x = Phaser.Math.Clamp(sprite.x, r.left + radius, r.right - radius);
    sprite.y = Phaser.Math.Clamp(sprite.y, r.top + radius, r.bottom - radius);
  }

  randomPoint(radius: number): { x: number; y: number } {
    const r = this.rect;
    return {
      x: Phaser.Math.Between(r.left + radius, r.right - radius),
      y: Phaser.Math.Between(r.top + radius, r.bottom - radius),
    };
  }

  randomEdgePoint(radius: number): { x: number; y: number } {
    const r = this.rect;
    const edge = Phaser.Math.Between(0, 3);
    switch (edge) {
      case 0:
        return {
          x: Phaser.Math.Between(r.left + radius, r.right - radius),
          y: r.top + radius,
        };
      case 1:
        return {
          x: Phaser.Math.Between(r.left + radius, r.right - radius),
          y: r.bottom - radius,
        };
      case 2:
        return {
          x: r.left + radius,
          y: Phaser.Math.Between(r.top + radius, r.bottom - radius),
        };
      default:
        return {
          x: r.right - radius,
          y: Phaser.Math.Between(r.top + radius, r.bottom - radius),
        };
    }
  }

  destroy(): void {
    this.borderGfx?.destroy();
    this.dangerGfx?.destroy();
  }

  private applyPhysicsBounds(): void {
    const r = this.rect;
    this.scene.physics.world.setBounds(r.left, r.top, r.width, r.height);
  }

  private drawVisuals(progress: number): void {
    const r = this.rect;
    const pulse = 0.55 + Math.sin(this.scene.time.now / 220) * 0.15;

    this.dangerGfx.clear();
    this.dangerGfx.fillStyle(0x2a0808, 0.35 + progress * 0.25);
    this.dangerGfx.fillRect(0, 0, WORLD_WIDTH, r.top);
    this.dangerGfx.fillRect(0, r.bottom, WORLD_WIDTH, WORLD_HEIGHT - r.bottom);
    this.dangerGfx.fillRect(0, r.top, r.left, r.height);
    this.dangerGfx.fillRect(r.right, r.top, WORLD_WIDTH - r.right, r.height);

    this.borderGfx.clear();
    this.borderGfx.lineStyle(3, 0xd4a84b, pulse);
    this.borderGfx.strokeRect(r.left, r.top, r.width, r.height);
    this.borderGfx.lineStyle(1, 0xb8a0e8, 0.35);
    this.borderGfx.strokeRect(r.left + 4, r.top + 4, r.width - 8, r.height - 8);
  }
}
