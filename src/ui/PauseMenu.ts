import Phaser from "phaser";
import type { GameState } from "../game/state";
import {
  getUpgradeLevel,
  UPGRADE_LABELS,
  UPGRADE_LINES,
} from "../game/powerups";
import { FantasyTheme } from "./theme";

const DEPTH = 130;

export class PauseMenu {
  private container: Phaser.GameObjects.Container | null = null;

  constructor(private readonly scene: Phaser.Scene) {}

  show(
    state: GameState,
    onResume: () => void,
    onRestart: () => void,
    onToggleMute: () => void
  ): void {
    this.destroy();

    const { colors, fonts } = FantasyTheme;
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const touchScreen = this.scene.sys.game.device.input.touch;
    const portrait = h > w;
    const panelW = portrait ? Math.min(w - 32, 440) : 500;
    const panelH = portrait ? Math.min(h - 80, 640) : 430;
    const objects: Phaser.GameObjects.GameObject[] = [];

    objects.push(
      this.scene.add
        .rectangle(w / 2, h / 2, w, h, 0x080604, 0.7)
        .setScrollFactor(0)
    );
    objects.push(
      this.scene.add
        .rectangle(w / 2, h / 2, panelW, panelH, 0x1c1711, 0.98)
        .setStrokeStyle(2, 0xd4a84b, 0.85)
        .setScrollFactor(0)
    );

    objects.push(
      this.scene.add
        .text(w / 2, h / 2 - panelH / 2 + 48, "Vigil Menu", {
          fontFamily: fonts.title,
          fontSize: portrait ? "30px" : "32px",
          color: colors.goldBright,
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
    );

    const pickups = state.pickupsCollected;
    objects.push(
      this.scene.add
        .text(
          portrait ? w / 2 : w / 2 - 128,
          h / 2 - (portrait ? 192 : 45),
          `Soul shards: ${pickups.soul}\nVitality: ${pickups.vitality}\nPlating: ${pickups.plating}`,
          {
            fontFamily: fonts.body,
            fontSize: portrait ? "20px" : "21px",
            color: colors.parchment,
            align: "center",
          }
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
    );

    const upgradeText = UPGRADE_LINES.map((line) => {
      const level = getUpgradeLevel(state, line);
      return `${UPGRADE_LABELS[line]}  ${level}/3`;
    }).join("\n");
    objects.push(
      this.scene.add
        .text(
          portrait ? w / 2 : w / 2 + 118,
          h / 2 - (portrait ? 76 : 48),
          upgradeText,
          {
            fontFamily: fonts.body,
            fontSize: portrait ? "18px" : "17px",
            color: colors.parchment,
            align: portrait ? "center" : "left",
          }
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
    );

    const firstButtonY = h / 2 + (portrait ? 110 : 86);
    const buttonGap = portrait ? 58 : 50;
    objects.push(this.createButton(w / 2, firstButtonY, "Resume", onResume));
    objects.push(
      this.createButton(
        w / 2,
        firstButtonY + buttonGap,
        state.muted ? "Unmute" : "Mute",
        onToggleMute
      )
    );
    objects.push(
      this.createButton(w / 2, firstButtonY + buttonGap * 2, "Restart", onRestart)
    );

    objects.push(
      this.scene.add
        .text(
          w / 2,
          h / 2 + panelH / 2 - 28,
          touchScreen ? "Tap Resume to continue" : "Q: resume",
          {
            fontFamily: fonts.body,
            fontSize: "15px",
            color: colors.mute,
          }
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
    );

    this.container = this.scene.add.container(0, 0, objects).setDepth(DEPTH);
  }

  destroy(): void {
    this.container?.destroy(true);
    this.container = null;
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const { colors, fonts } = FantasyTheme;
    const bg = this.scene.add
      .rectangle(0, 0, 196, 48, 0x2a2420, 0.98)
      .setStrokeStyle(2, 0x8cb8d8, 0.65);
    const text = this.scene.add
      .text(0, 0, label, {
        fontFamily: fonts.hud,
        fontSize: "18px",
        color: colors.parchment,
      })
      .setOrigin(0.5);
    const button = this.scene.add
      .container(x, y, [bg, text])
      .setSize(196, 48)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    button.on("pointerover", () => bg.setStrokeStyle(3, 0xf0d080, 1));
    button.on("pointerout", () => bg.setStrokeStyle(2, 0x8cb8d8, 0.65));
    button.on("pointerdown", onClick);
    return button;
  }
}
