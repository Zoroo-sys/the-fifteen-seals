import { AudioEngine } from "./audio.js";
import { Certificate } from "./certificate.js";
import { Stopwatch } from "./clock.js";
import { View } from "./ui.js";
import { Vault } from "./vault.js";

const view = new View();
const certificate = new Certificate();
const stopwatch = new Stopwatch((text) => view.setElapsed(text));

const vault = new Vault({
  view,
  audio: new AudioEngine(),
  stopwatch,
  onEnterVictory: () => certificate.awaitVerification(),
  onVictory: (solveTime, verified, rank) => {
    certificate.setSolveTime(solveTime);
    certificate.applyVerification(verified, rank);
  },
  onRestart: () => certificate.reset(),
});

view.bindRestart(() => vault.restart());
vault.start();
