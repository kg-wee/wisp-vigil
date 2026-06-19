import Phaser from "phaser";
import { WORLD_HEIGHT, WORLD_WIDTH } from "../game/state";
import { FantasyTheme } from "./theme";

/** Stone floor, torch vignette, and faint ward circle for the arena. */
export function drawArenaBackdrop(scene: Phaser.Scene): void {
  const { bgArena, bgStone, grid, gridAccent } = FantasyTheme.colors;

  scene.add
    .rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, bgArena)
    .setDepth(0);

  const floor = scene.add.graphics().setDepth(0);
  const tile = 40;
  for (let x = 0; x < WORLD_WIDTH; x += tile) {
    for (let y = 0; y < WORLD_HEIGHT; y += tile) {
      const alt = ((x / tile + y / tile) % 2) === 0;
      floor.fillStyle(alt ? bgStone : bgArena, 1);
      floor.fillRect(x + 1, y + 1, tile - 2, tile - 2);
      floor.lineStyle(1, alt ? gridAccent : grid, 0.6);
      floor.strokeRect(x + 0.5, y + 0.5, tile - 1, tile - 1);
    }
  }

  const ward = scene.add.graphics().setDepth(1);
  ward.lineStyle(2, FantasyTheme.colors.goldHex, 0.12);
  const cx = WORLD_WIDTH / 2;
  const cy = WORLD_HEIGHT / 2;
  ward.strokeCircle(cx, cy, 220);
  ward.lineStyle(1, FantasyTheme.colors.arcaneHex, 0.08);
  ward.strokeCircle(cx, cy, 160);

  const vignette = scene.add.graphics().setDepth(2);
  const edge = 120;
  vignette.fillStyle(0x0a0806, 0.55);
  vignette.fillRect(0, 0, WORLD_WIDTH, edge);
  vignette.fillRect(0, WORLD_HEIGHT - edge, WORLD_WIDTH, edge);
  vignette.fillRect(0, 0, edge, WORLD_HEIGHT);
  vignette.fillRect(WORLD_WIDTH - edge, 0, edge, WORLD_HEIGHT);
}
