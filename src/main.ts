import Phaser from "phaser";
import { createGameConfig } from "./game/config";

const parent = "game-container";

const game = new Phaser.Game(createGameConfig(parent));

export default game;
