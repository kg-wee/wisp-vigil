import Phaser from "phaser";
import { registerPlaceholderTextures } from "../assets/TextureFactory";
import {
  ENTITY_SHEET,
  preloadSprites,
  registerEntityAnimations,
} from "../assets/sprites";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "Boot" });
  }

  preload(): void {
    preloadSprites(this);
  }

  create(): void {
    if (!this.textures.exists(ENTITY_SHEET)) {
      console.warn("entities spritesheet missing, using placeholder textures");
      registerPlaceholderTextures(this);
    } else {
      registerEntityAnimations(this);
    }
    this.scene.start("Menu");
  }
}
