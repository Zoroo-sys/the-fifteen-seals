export function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export class Stopwatch {
  
  constructor(onTick) {
    this.onTick = onTick;
    this.startedAt = Date.now();
    this.timer = null;
  }

  start() {
    this.stop();
    this.startedAt = Date.now();
    this.onTick(this.text());
    this.timer = setInterval(() => this.onTick(this.text()), 1000);
  }

  stop() {
    clearInterval(this.timer);
    this.timer = null;
  }

  text() {
    return formatDuration(Date.now() - this.startedAt);
  }
}
