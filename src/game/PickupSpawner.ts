import Phaser from "phaser";
import { createPickupSprite, type PickupType } from "../assets/sprites";
import type { ArenaBounds } from "./ArenaBounds";
import { pickClearPoint } from "./spawnPlacement";
import { PICKUP_RADIUS } from "./state";

const PICKUP_DATA_KEY = "pickupType";

const WEIGHTS: { type: PickupType; weight: number }[] = [
  { type: "soul", weight: 50 },
  { type: "vitality", weight: 25 },
  { type: "plating", weight: 25 },
];

export function getPickupType(sprite: Phaser.Physics.Arcade.Sprite): PickupType {
  return (sprite.getData(PICKUP_DATA_KEY) as PickupType) ?? "soul";
}

export class PickupSpawner {
  private readonly group: Phaser.Physics.Arcade.Group;
  private spawnTimer = 0;

  constructor(private readonly scene: Phaser.Scene) {
    this.group = scene.physics.add.group();
  }

  get pickups(): Phaser.Physics.Arcade.Group {
    return this.group;
  }

  reset(): void {
    this.group.clear(true, true);
    this.spawnTimer = 0;
  }

  update(
    deltaMs: number,
    arena: ArenaBounds,
    obstacles: Phaser.Physics.Arcade.StaticGroup
  ): void {
    this.spawnTimer += deltaMs;
    if (this.spawnTimer >= 3500 && this.group.countActive() < 4) {
      this.spawnTimer = 0;
      this.spawn(arena, obstacles);
    }
  }

  private rollType(): PickupType {
    const total = WEIGHTS.reduce((s, w) => s + w.weight, 0);
    let roll = Phaser.Math.Between(1, total);
    for (const entry of WEIGHTS) {
      roll -= entry.weight;
      if (roll <= 0) return entry.type;
    }
    return "soul";
  }

  private spawn(
    arena: ArenaBounds,
    obstacles: Phaser.Physics.Arcade.StaticGroup
  ): void {
    const point = pickClearPoint(arena, obstacles, PICKUP_RADIUS);
    if (!point) return;

    const type = this.rollType();
    const pickup = createPickupSprite(this.scene, point.x, point.y, type);
    pickup.setCircle(PICKUP_RADIUS);
    pickup.setData(PICKUP_DATA_KEY, type);
    this.group.add(pickup);
  }
}
