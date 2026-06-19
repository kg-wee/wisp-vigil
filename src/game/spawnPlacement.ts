import Phaser from "phaser";
import type { ArenaBounds } from "./ArenaBounds";
import { OBSTACLE_RADIUS, PICKUP_RADIUS } from "./state";

/** Min gap between pickup center and obstacle edge. */
export const PICKUP_OBSTACLE_CLEARANCE = 20;

const MAX_ATTEMPTS = 32;

export function pickClearPoint(
  arena: ArenaBounds,
  obstacles: Phaser.Physics.Arcade.StaticGroup,
  entityRadius: number,
  extraClearance = PICKUP_OBSTACLE_CLEARANCE
): { x: number; y: number } | null {
  const padding = entityRadius + 12;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const { x, y } = arena.randomPoint(padding);
    if (isClearOfObstacles(x, y, entityRadius, obstacles, extraClearance)) {
      return { x, y };
    }
  }

  return null;
}

export function isClearOfObstacles(
  x: number,
  y: number,
  entityRadius: number,
  obstacles: Phaser.Physics.Arcade.StaticGroup,
  extraClearance: number
): boolean {
  let clear = true;

  obstacles.children.each((child) => {
    const obstacle = child as Phaser.Physics.Arcade.Image;
    const body = obstacle.body as Phaser.Physics.Arcade.StaticBody | null;
    const obstacleRadius = body
      ? Math.max(body.halfWidth, body.halfHeight)
      : obstacle.displayWidth / 2 || OBSTACLE_RADIUS;
    const minDist = entityRadius + obstacleRadius + extraClearance;
    const dist = Phaser.Math.Distance.Between(x, y, obstacle.x, obstacle.y);
    if (dist < minDist) {
      clear = false;
      return false;
    }
    return true;
  });

  return clear;
}

/** Default pickup spawn clearance constant for docs/tests. */
export const PICKUP_SPAWN_RADIUS = PICKUP_RADIUS;
