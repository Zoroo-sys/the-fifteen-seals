import { AudioEngine } from "./audio.js";
import { Certificate } from "./certificate.js";
import { Stopwatch } from "./clock.js";
import { View } from "./ui.js";
import { Vault } from "./vault.js";

const view = new View();
const certificate = new Certificate();
const stopwatch = new Stopwatch((text) => view.setElapsed(text));
const vault = new Vault({ view, audio: new AudioEngine(), stopwatch });

vault.addEventListener("vault:victory-entered", () => certificate.awaitVerification());
vault.addEventListener("vault:victory-verified", (e) => {
  certificate.setSolveTime(e.detail.solveTime);
  certificate.applyVerification(e.detail.verified, e.detail.rank);
});
vault.addEventListener("vault:restarted", () => certificate.reset());
view.bindRestart(() => vault.restart());
vault.start();
