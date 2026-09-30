import { PUZZLES } from "./puzzles.js";
import { STORAGE_KEYS, TIMING } from "./config.js";
import { checkGuess, verifyCompletion } from "./api.js";
import { Reel } from "./reel.js";
import { loadProgress, loadOrCreateSessionId, readItem, writeItem, removeItem } from "./storage.js";


export class Vault {
 
  constructor({ view, audio, stopwatch, onEnterVictory, onVictory, onRestart }) {
    this.view = view;
    this.audio = audio;
    this.stopwatch = stopwatch;
    this.onEnterVictory = onEnterVictory;
    this.onVictory = onVictory;
    this.onRestart = onRestart;

    this.sid = loadOrCreateSessionId();
    this.proof = readItem(STORAGE_KEYS.proof);
    this.index = loadProgress(PUZZLES.length);
    this.reels = [];
    this.checkTimer = null;
    this.retryTimer = null;
    this.advanceTimer = null;
    this.checkToken = 0;
    this.rejected = new Set();
    this.blockedUntil = new Map(); 
  }

  start() {
    this.stopwatch.start();
    this.render();
  }

  restart() {
    clearTimeout(this.advanceTimer);
    this.index = 0;
    this.proof = null;
    writeItem(STORAGE_KEYS.progress, 0);
    removeItem(STORAGE_KEYS.finalTime);
    removeItem(STORAGE_KEYS.proof);
    this.stopwatch.start();
    this.onRestart();
    this.render();
  }

  render() {
    this.view.renderProgress(this.index, PUZZLES.length);
    if (this.index >= PUZZLES.length) {
      this.enterVictory();
      return;
    }
    const puzzle = PUZZLES[this.index];
    this.view.showPuzzle({ index: this.index, total: PUZZLES.length, hint: puzzle.hint });
    this.buildReels(puzzle.length);
  }

  buildReels(count) {
    this.cancelPendingChecks();
    this.view.reelsContainer.replaceChildren();
    this.reels = Array.from({ length: count }, () => new Reel(this.view.reelsContainer, () => this.scheduleCheck(), this.audio));
  }

  cancelPendingChecks() {
    clearTimeout(this.checkTimer);
    clearTimeout(this.retryTimer);
    this.checkToken++;
  }

  scheduleCheck() {
    if (this.index >= PUZZLES.length || !this.reels.length || this.reels[0].locked) return;

    const sealIndex = this.index;
    const guess = this.reels.map((reel) => reel.char).join("");
    clearTimeout(this.checkTimer);
    const token = ++this.checkToken;

    
    if (this.rejected.has(`${sealIndex}:${guess}`)) return;

    const blockedFor = (this.blockedUntil.get(sealIndex) || 0) - Date.now();
    if (blockedFor > 0) {
      this.showBlocked(blockedFor);
      return;
    }

    this.checkTimer = setTimeout(() => this.runCheck(sealIndex, guess, token), TIMING.verifyDelayMs);
  }

  async runCheck(sealIndex, guess, token) {
    let reply;
    try {
      reply = await checkGuess(sealIndex, guess, this.sid, this.proof);
    } catch (error) {
      if (token !== this.checkToken) return;
     
      console.warn("[vault] worker request failed:", error);
      this.view.flashFooter("Couldn't reach the vault - check your connection.");
      return;
    }

    const status = reply?.status;
    
    if (status === "wrong") this.rejected.add(`${sealIndex}:${guess}`);
    if (status === "limited") this.blockedUntil.set(sealIndex, Date.now() + reply.retryAfter * 1000);
    if (status === "unlock") {
      this.proof = reply.proof;
      writeItem(STORAGE_KEYS.proof, reply.proof);
    }
    if (token !== this.checkToken) return;

    switch (status) {
      case "unlock":
        this.unlock();
        break;
      case "reset":
        this.restart();
        break;
      case "limited":
        this.showBlocked(reply.retryAfter * 1000);
        break;
      case "wrong":
        break;
      case "sequence":
        
        console.warn("[vault] worker refused: seal attempted out of order");
        this.view.flashFooter("Solve the earlier locks first.");
        break;
      default:
        console.warn("[vault] unexpected worker reply:", reply);
        this.view.flashFooter("The vault sent a reply this page doesn't understand.");
    }
  }

  
  showBlocked(ms) {
    const seconds = Math.ceil(ms / 1000);
    const wait = seconds <= 90 ? `${seconds}s` : `about ${Math.ceil(seconds / 60)} min`;
    const message = `Too many attempts - try again in ${wait}.`;
    this.view.setFooter(message);

    clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => {
      if (this.view.footerText === message) this.view.setFooter("");
      this.scheduleCheck();
    }, ms + TIMING.blockRetryPaddingMs);
  }

  unlock() {
    this.view.setLockOpen(true);
    this.view.setFooter("Unlocked");
    this.reels.forEach((reel) => reel.setLocked(true));

    const isLast = this.index === PUZZLES.length - 1;
    if (isLast) this.audio.victory();
    else this.audio.unlockChime();

    this.advanceTimer = setTimeout(() => {
      this.index++;
      writeItem(STORAGE_KEYS.progress, this.index);
      this.render();
    }, TIMING.unlockAdvanceMs);
  }

  
  async enterVictory() {
    this.cancelPendingChecks();
    this.stopwatch.stop();

    let solveTime = readItem(STORAGE_KEYS.finalTime);
    if (solveTime === null) {
      solveTime = this.stopwatch.text();
      writeItem(STORAGE_KEYS.finalTime, solveTime);
    }
    this.view.setElapsed(solveTime);
    this.view.showVictory();
    this.onEnterVictory();

    let verified = false;
    let rank = null;
    try {
      const reply = await verifyCompletion(this.sid, this.proof);
      verified = reply.status === "verified";
      rank = verified ? reply.rank : null;
    } catch (error) {
      console.warn("[vault] could not verify completion:", error);
    }
    this.onVictory(solveTime, verified, rank);
  }
}
