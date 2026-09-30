import { CHARSET, DRAG_STEP_PX, TIMING } from "./config.js";

export class Reel {
 
  constructor(container, onChange, audio) {
    this.value = 0;
    this.locked = false;
    this.onChange = onChange;
    this.audio = audio;
    this.build(container);
    this.bindButton(this.upBtn, 1);
    this.bindButton(this.downBtn, -1);
    this.bindWheel();
    this.bindDrag();
    this.bindKeys();
  }

  get char() {
    return CHARSET[this.value];
  }

  turn(direction) {
    const size = CHARSET.length;
    this.value = (this.value + direction + size) % size;
    this.digit.textContent = this.char;
    this.el.setAttribute("aria-valuenow", String(this.value));
    this.audio.click();
    this.onChange();
  }

  setLocked(locked) {
    this.locked = locked;
    this.el.classList.toggle("locked", locked);
    this.upBtn.disabled = locked;
    this.downBtn.disabled = locked;
    this.el.tabIndex = locked ? -1 : 0;
  }

  build(container) {
    this.el = document.createElement("div");
    this.el.className = "reel";
    this.el.tabIndex = 0;
    this.el.setAttribute("role", "spinbutton");
    this.el.setAttribute("aria-valuemin", "0");
    this.el.setAttribute("aria-valuemax", String(CHARSET.length - 1));
    this.el.setAttribute("aria-valuenow", "0");

    this.upBtn = this.buildButton("▲", "Increase");
    this.digit = document.createElement("div");
    this.digit.className = "reel-window";
    this.digit.textContent = CHARSET[0];
    this.downBtn = this.buildButton("▼", "Decrease");

    this.el.append(this.upBtn, this.digit, this.downBtn);
    container.appendChild(this.el);
  }

  buildButton(symbol, label) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "reel-btn";
    button.textContent = symbol;
    button.setAttribute("aria-label", label);
    return button;
  }

  
  bindButton(button, direction) {
    let holdTimer = null;
    let repeatTimer = null;

    const release = () => {
      clearTimeout(holdTimer);
      clearInterval(repeatTimer);
    };

    button.addEventListener("pointerdown", (event) => {
      if (this.locked) return;
      event.preventDefault();
      this.turn(direction);
      holdTimer = setTimeout(() => {
        repeatTimer = setInterval(() => {
          if (this.locked) return release();
          this.turn(direction);
        }, TIMING.holdRepeatMs);
      }, TIMING.holdDelayMs);
    });

    for (const type of ["pointerup", "pointerleave", "pointercancel"]) {
      button.addEventListener(type, release);
    }
  }

  bindWheel() {
    this.el.addEventListener(
      "wheel",
      (event) => {
        if (this.locked) return;
        event.preventDefault();
        this.turn(event.deltaY < 0 ? 1 : -1);
      },
      { passive: false }
    );
  }

 
  bindDrag() {
    let dragging = false;
    let lastY = 0;
    let travelled = 0;

    this.digit.addEventListener("pointerdown", (event) => {
      if (this.locked) return;
      dragging = true;
      lastY = event.clientY;
      travelled = 0;
      this.digit.setPointerCapture(event.pointerId);
    });

    this.digit.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      travelled += lastY - event.clientY; 
      lastY = event.clientY;
      while (Math.abs(travelled) >= DRAG_STEP_PX) {
        const step = Math.sign(travelled);
        this.turn(step);
        travelled -= step * DRAG_STEP_PX;
      }
    });

    const stop = () => {
      dragging = false;
    };
    this.digit.addEventListener("pointerup", stop);
    this.digit.addEventListener("pointercancel", stop);
  }

  bindKeys() {
    this.el.addEventListener("keydown", (event) => {
      if (this.locked) return;
      const actions = {
        arrowup: () => this.turn(1),
        w: () => this.turn(1),
        arrowdown: () => this.turn(-1),
        s: () => this.turn(-1),
        arrowleft: () => this.focusNeighbor(-1),
        a: () => this.focusNeighbor(-1),
        arrowright: () => this.focusNeighbor(1),
        d: () => this.focusNeighbor(1),
      };
      const action = actions[event.key.toLowerCase()];
      if (!action) return;
      action();
      event.preventDefault();
    });
  }

  focusNeighbor(direction) {
    const siblings = Array.from(this.el.parentElement.children);
    const target = siblings[siblings.indexOf(this.el) + direction];
    if (target) target.focus();
  }
}
