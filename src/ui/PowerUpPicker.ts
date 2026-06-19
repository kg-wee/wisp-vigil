import Phaser from "phaser";
import type { PowerUp } from "../game/powerups";
import { FantasyTheme } from "./theme";

const DEPTH = 120;
const HOTKEY_EVENTS = ["keydown-ONE", "keydown-TWO", "keydown-THREE"] as const;

export class PowerUpPicker {
  private container: Phaser.GameObjects.Container | null = null;
  private keyHandlers: Array<() => void> = [];

  constructor(private readonly scene: Phaser.Scene) {}

  show(choices: PowerUp[], onPick: (choice: PowerUp) => void): void {
    this.destroy();

    const { colors, fonts } = FantasyTheme;
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const objects: Phaser.GameObjects.GameObject[] = [];

    const shade = this.scene.add
      .rectangle(w / 2, h / 2, w, h, 0x080604, 0.72)
      .setScrollFactor(0);
    objects.push(shade);

    const panel = this.scene.add
      .rectangle(w / 2, h / 2, 650, 330, 0x1c1711, 0.97)
      .setStrokeStyle(2, 0xd4a84b, 0.85)
      .setScrollFactor(0);
    objects.push(panel);

    const title = this.scene.add
      .text(w / 2, h / 2 - 132, "Choose a Power", {
        fontFamily: fonts.title,
        fontSize: "30px",
        color: colors.goldBright,
      })
      .setOrigin(0.5)
      .setScrollFactor(0);
    objects.push(title);

    const cardW = 190;
    const cardH = 190;
    const gap = 18;
    const totalW = choices.length * cardW + (choices.length - 1) * gap;
    const startX = w / 2 - totalW / 2 + cardW / 2;
    choices.forEach((choice, index) => {
      const x = startX + index * (cardW + gap);
      const y = h / 2 + 28;
      const card = this.scene.add
        .rectangle(x, y, cardW, cardH, choice.available ? 0x2a2420 : 0x201b18, 0.98)
        .setStrokeStyle(2, choice.available ? 0x8cb8d8 : 0x6a5c4a, 0.55)
        .setScrollFactor(0);
      if (choice.available) {
        card.setInteractive({ useHandCursor: true });
      }
      const number = this.scene.add
        .text(x, y - 70, `${index + 1}`, {
          fontFamily: fonts.hud,
          fontSize: "20px",
          color: choice.available ? colors.ward : colors.mute,
        })
        .setOrigin(0.5)
        .setScrollFactor(0);
      const name = this.scene.add
        .text(x, y - 24, choice.name, {
          fontFamily: fonts.hud,
          fontSize: "18px",
          color: choice.available ? colors.parchment : colors.mute,
          align: "center",
          wordWrap: { width: cardW - 28 },
        })
        .setOrigin(0.5)
        .setScrollFactor(0);
      const desc = this.scene.add
        .text(x, y + 44, choice.description, {
          fontFamily: fonts.body,
          fontSize: "17px",
          color: choice.available ? colors.parchmentDim : colors.mute,
          align: "center",
          wordWrap: { width: cardW - 28 },
        })
        .setOrigin(0.5)
        .setScrollFactor(0);

      const pick = () => onPick(choice);
      if (choice.available) {
        card.on("pointerover", () => card.setStrokeStyle(3, 0xf0d080, 1));
        card.on("pointerout", () => card.setStrokeStyle(2, 0x8cb8d8, 0.55));
        card.on("pointerdown", pick);
      }

      objects.push(card, number, name, desc);
    });

    const hint = this.scene.add
      .text(w / 2, h / 2 + 146, "Press 1, 2, or 3", {
        fontFamily: fonts.body,
        fontSize: "16px",
        color: colors.mute,
      })
      .setOrigin(0.5)
      .setScrollFactor(0);
    objects.push(hint);

    this.container = this.scene.add.container(0, 0, objects).setDepth(DEPTH);
    this.scene.tweens.add({
      targets: this.container,
      alpha: { from: 0, to: 1 },
      duration: 140,
      ease: "Sine.easeOut",
    });

    this.keyHandlers = choices.map((choice, index) => {
      if (!choice.available) return () => undefined;
      const eventName = HOTKEY_EVENTS[index];
      const handler = () => onPick(choice);
      this.scene.input.keyboard?.once(eventName, handler);
      return () => this.scene.input.keyboard?.off(eventName, handler);
    });
  }

  destroy(): void {
    for (const off of this.keyHandlers) off();
    this.keyHandlers = [];
    this.container?.destroy(true);
    this.container = null;
  }
}
