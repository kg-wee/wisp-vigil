import Phaser from "phaser";
import {
  ARCHER_RADIUS,
  BOSS_RADIUS,
  HAZARD_RADIUS,
  OBSTACLE_RADIUS,
  PICKUP_RADIUS,
  PLAYER_RADIUS,
  PROJECTILE_RADIUS,
} from "../game/state";
import { FantasyTheme } from "../ui/theme";

const C = FantasyTheme.colors;

export function registerPlaceholderTextures(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);

  const drawCircle = (key: string, radius: number, fill: number, stroke: number) => {
    g.clear();
    g.fillStyle(fill, 1);
    g.fillCircle(radius, radius, radius - 2);
    g.lineStyle(2, stroke, 1);
    g.strokeCircle(radius, radius, radius - 2);
    g.generateTexture(key, radius * 2, radius * 2);
  };

  drawCircle("player", PLAYER_RADIUS, C.arcaneHex, 0xe8dcc8);
  drawCircle("hazard", HAZARD_RADIUS, C.balefireHex, 0x5a1810);
  drawCircle("pickup", PICKUP_RADIUS, C.soulHex, 0xc9e8b0);
  drawCircle("pickup_health", PICKUP_RADIUS, 0x44aa66, 0xc9e8b0);
  drawCircle("pickup_armor", PICKUP_RADIUS, C.wardHex, 0xe8dcc8);
  drawCircle("archer", ARCHER_RADIUS, 0xcc6633, 0x5a1810);
  drawCircle("boss", BOSS_RADIUS, 0x8b2020, C.goldHex);
  drawCircle("projectile", PROJECTILE_RADIUS, C.balefireHex, 0x3a0a0a);
  drawCircle("obstacle", OBSTACLE_RADIUS, 0x5a5248, 0x2a2420);

  g.destroy();
}
