import Phaser from "phaser";
import { FantasyTheme } from "../ui/theme";
import { configureWorldSize } from "./state";
import { selectWorldSize } from "./layout";
import { BootScene } from "../scenes/BootScene";
import { MenuScene } from "../scenes/MenuScene";
import { GameScene } from "../scenes/GameScene";
import { GameOverScene } from "../scenes/GameOverScene";

export function createGameConfig(parent: string): Phaser.Types.Core.GameConfig {
  const world = selectWorldSize();
  configureWorldSize(world.width, world.height);

  return {
    type: Phaser.AUTO,
    parent,
    width: world.width,
    height: world.height,
    backgroundColor: `#${FantasyTheme.colors.bgDeep.toString(16).padStart(6, "0")}`,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: "arcade",
      arcade: {
        debug: false,
      },
    },
    scene: [BootScene, MenuScene, GameScene, GameOverScene],
  };
}
