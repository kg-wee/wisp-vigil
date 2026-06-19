import Phaser from "phaser";
import { createObstacleSprite } from "../assets/sprites";
import { OBSTACLE_RADIUS } from "./state";
import type { ArenaBounds } from "./ArenaBounds";

const LAYOUT: { x: number; y: number; scale: number }[] = [
  { x: 220, y: 180, scale: 1 },
  { x: 580, y: 200, scale: 0.9 },
  { x: 400, y: 310, scale: 1.15 },
  { x: 260, y: 440, scale: 0.95 },
  { x: 560, y: 420, scale: 1.05 },
  { x: 400, y: 150, scale: 0.85 },
];

export class EnvironmentObstacles {
  readonly group: Phaser.Physics.Arcade.StaticGroup;

  constructor(
    private readonly scene: Phaser.Scene,
    arena: ArenaBounds
  ) {
    this.group = scene.physics.add.staticGroup();

    for (const spot of LAYOUT) {
      if (!arena.contains(spot.x, spot.y, OBSTACLE_RADIUS * spot.scale + 8)) {
        continue;
      }
      const obstacle = createObstacleSprite(scene, spot.x, spot.y, spot.scale);
      obstacle.setCircle(OBSTACLE_RADIUS * spot.scale);
      this.group.add(obstacle);
    }

    if (this.group.countActive() < 3) {
      this.spawnFallbackPillars(arena);
    }
  }

  private spawnFallbackPillars(arena: ArenaBounds): void {
    for (let i = 0; i < 4; i++) {
      const { x, y } = arena.randomPoint(OBSTACLE_RADIUS + 20);
      const obstacle = createObstacleSprite(this.scene, x, y, 1);
      obstacle.setCircle(OBSTACLE_RADIUS);
      this.group.add(obstacle);
    }
  }

  reset(): void {
    this.group.clear(true, true);
  }
}
