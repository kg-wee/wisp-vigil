import Phaser from "phaser";
import { FantasyTheme } from "./theme";

const TITLE_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: FantasyTheme.fonts.title,
  fontSize: "44px",
  color: FantasyTheme.colors.goldBright,
  fontStyle: "bold",
};

const BODY_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: FantasyTheme.fonts.body,
  fontSize: "19px",
  color: FantasyTheme.colors.parchment,
  align: "center",
};

export function createTitle(
  scene: Phaser.Scene,
  y: number,
  text: string
): Phaser.GameObjects.Text {
  return scene.add
    .text(scene.scale.width / 2, y, text, TITLE_STYLE)
    .setOrigin(0.5)
    .setShadow(2, 2, "#1a1008", 4, true, true);
}

export function createBody(
  scene: Phaser.Scene,
  y: number,
  text: string
): Phaser.GameObjects.Text {
  return scene.add
    .text(scene.scale.width / 2, y, text, BODY_STYLE)
    .setOrigin(0.5)
    .setShadow(1, 1, "#1a1008", 2, true, true);
}
