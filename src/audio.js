const SOUND_FILES = {
  click: "assets/audio/click.mp3",
  unlock: "assets/audio/unlock.mp3",
  victory: "assets/audio/victory.mp3",
};


export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.buffers = {};
    this.loading = null;
  }

  click() {
    this.play("click");
  }

  unlockChime() {
    this.play("unlock");
  }

  victory() {
    this.play("victory");
  }

  play(name) {
    const ctx = this.ensureContext();
    this.ready().then(() => {
      const buffer = this.buffers[name];
      if (!buffer) return; // failed to load - see console
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(ctx.currentTime);
    });
  }

  
  ensureContext() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    return this.ctx;
  }

 
  ready() {
    if (!this.loading) {
      const ctx = this.ensureContext();
      this.loading = Promise.all(
        Object.entries(SOUND_FILES).map(([name, url]) =>
          fetch(url)
            .then((response) => response.arrayBuffer())
            .then((data) => ctx.decodeAudioData(data))
            .then((buffer) => {
              this.buffers[name] = buffer;
            })
            .catch((error) => {
              console.warn(`[audio] could not load ${name} (${url}):`, error);
            })
        )
      );
    }
    return this.loading;
  }
}
