import { TIMING } from "./config.js";


export class View {
  constructor(root = document) {
    const byId = (id) => root.getElementById(id);
    this.el = {
      seals: byId("seals"),
      progressPct: byId("progressPct"),
      elapsed: byId("elapsedTime"),
      hintNum: byId("hintNum"),
      hintText: byId("hintText"),
      lock: byId("lock"),
      reels: byId("reels"),
      footer: byId("lockFooter"),
      puzzle: byId("puzzleView"),
      victory: byId("victoryView"),
      restart: byId("resetBtn"),
    };
  }

  get reelsContainer() {
    return this.el.reels;
  }

  get footerText() {
    return this.el.footer.textContent;
  }

  bindRestart(handler) {
    this.el.restart.addEventListener("click", handler);
  }

  renderProgress(solved, total) {
    this.el.seals.replaceChildren(
      ...Array.from({ length: total }, (_, i) => {
        const dot = document.createElement("div");
        dot.className = "seal-dot";
        if (i < solved) dot.classList.add("done");
        if (i === solved) dot.classList.add("active");
        return dot;
      })
    );
    this.el.progressPct.textContent = `${Math.round((solved / total) * 100)}%`;
  }

  showPuzzle({ index, total, hint }) {
    this.el.puzzle.classList.remove("hidden");
    this.el.victory.classList.add("hidden");
    this.el.lock.classList.remove("open");
    this.setFooter("");
    this.el.hintNum.textContent = `Lock ${index + 1} of ${total}`;
    this.el.hintText.textContent = hint;
  }

  showVictory() {
    this.el.puzzle.classList.add("hidden");
    this.el.victory.classList.remove("hidden");
  }

  setLockOpen(open) {
    this.el.lock.classList.toggle("open", open);
  }

  setElapsed(text) {
    this.el.elapsed.textContent = text;
  }

  setFooter(text) {
    this.el.footer.textContent = text;
  }

  flashFooter(text) {
    this.setFooter(text);
    setTimeout(() => {
      if (this.footerText === text) this.setFooter("");
    }, TIMING.footerFlashMs);
  }
}
