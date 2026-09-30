import { ASSETS } from "./config.js";

const CANVAS_SIZE = { width: 900, height: 1160 };
const SHIELD = { top: 180, width: 620, height: 760, photoInset: 34, borderWidth: 6 };
const LOGO = { top: 24, height: 66 };
const CAPTION_GAP = 56;

const COLORS = {
  backgroundTop: "#242119",
  backgroundBottom: "#141210",
  frame: ["#4a463d", "#2d2b25", "#201e19"],
  gold: "#c9a227",
  brightGold: "#d4af37",
  ivory: "#ece6d9",
  muted: "#a49c8b",
};

const canvas = document.createElement("canvas");
canvas.width = CANVAS_SIZE.width;
canvas.height = CANVAS_SIZE.height;

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`could not load ${src}`));
    image.src = src;
  });
}

let logoRequest = null;
const loadLogo = () => (logoRequest ??= loadImage(ASSETS.gem).catch(() => null));


export async function renderSeal({ photo, rankText = "", timeText = "" }) {
  const ctx = canvas.getContext("2d");
  const logo = await loadLogo();

  paintBackground(ctx);
  paintShield(ctx, photo);
  if (logo) paintLogo(ctx, logo);
  paintCaptions(ctx, rankText, timeText);
  return canvas.toDataURL("image/png");
}

function paintBackground(ctx) {
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_SIZE.height);
  gradient.addColorStop(0, COLORS.backgroundTop);
  gradient.addColorStop(1, COLORS.backgroundBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_SIZE.width, CANVAS_SIZE.height);
}

function tracePath(ctx) {
  const centerX = CANVAS_SIZE.width / 2;
  const left = centerX - SHIELD.width / 2;
  const right = centerX + SHIELD.width / 2;
  const bendY = SHIELD.top + SHIELD.height * 0.72;
  const controlY = SHIELD.top + SHIELD.height * 0.9;
  const tipY = SHIELD.top + SHIELD.height;

  ctx.beginPath();
  ctx.moveTo(left, SHIELD.top);
  ctx.lineTo(right, SHIELD.top);
  ctx.lineTo(right, bendY);
  ctx.quadraticCurveTo(right, controlY, centerX, tipY);
  ctx.quadraticCurveTo(left, controlY, left, bendY);
  ctx.closePath();
}

function paintShield(ctx, photo) {
  const left = CANVAS_SIZE.width / 2 - SHIELD.width / 2;

  ctx.save();
  tracePath(ctx);
  ctx.clip();

  const frame = ctx.createLinearGradient(left, SHIELD.top, left + SHIELD.width, SHIELD.top + SHIELD.height);
  COLORS.frame.forEach((color, i) => frame.addColorStop(i / (COLORS.frame.length - 1), color));
  ctx.fillStyle = frame;
  ctx.fillRect(left, SHIELD.top, SHIELD.width, SHIELD.height);

  if (photo) {
    const inset = SHIELD.photoInset;
    drawCover(ctx, photo, left + inset, SHIELD.top + inset, SHIELD.width - inset * 2, SHIELD.height - inset * 2);
  }
  ctx.restore();

  ctx.save();
  tracePath(ctx);
  ctx.lineWidth = SHIELD.borderWidth;
  ctx.strokeStyle = COLORS.gold;
  ctx.stroke();
  ctx.restore();
}

function paintLogo(ctx, logo) {
  const width = LOGO.height * (logo.naturalWidth / logo.naturalHeight);
  ctx.drawImage(logo, (CANVAS_SIZE.width - width) / 2, LOGO.top, width, LOGO.height);
}

function paintCaptions(ctx, rankText, timeText) {
  const centerX = CANVAS_SIZE.width / 2;
  const captionY = SHIELD.top + SHIELD.height + CAPTION_GAP;

  engrave(ctx, "SEISMIC", centerX, 148, "700 40px Georgia, serif", COLORS.gold);
  engrave(ctx, "VERIFIED ENCRYPTED PLAYER", centerX, captionY, "700 32px Georgia, serif", COLORS.ivory);

  ctx.textAlign = "center";
  ctx.fillStyle = COLORS.muted;
  ctx.font = "16px monospace";
  ctx.fillText("SEAL 15 / 15 · ALL LOCKS OPENED", centerX, captionY + 40);

  if (rankText) {
    ctx.fillStyle = COLORS.brightGold;
    ctx.font = "700 24px Georgia, serif";
    ctx.fillText(rankText, centerX, captionY + 82);
  }
  if (timeText) {
    ctx.fillStyle = COLORS.muted;
    ctx.font = "15px monospace";
    ctx.fillText(`SOLVED IN ${timeText}`, centerX, captionY + 108);
  }
}

function engrave(ctx, text, x, y, font, color) {
  ctx.textAlign = "center";
  ctx.font = font;
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillText(text, x + 2, y + 2.5);
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.fillText(text, x - 1, y - 1);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function drawCover(ctx, image, x, y, width, height) {
  const imageRatio = image.width / image.height;
  const boxRatio = width / height;
  let sw = image.width;
  let sh = image.height;
  let sx = 0;
  let sy = 0;
  if (imageRatio > boxRatio) {
    sw = sh * boxRatio;
    sx = (image.width - sw) / 2;
  } else {
    sh = sw / boxRatio;
    sy = (image.height - sh) / 2;
  }
  ctx.drawImage(image, sx, sy, sw, sh, x, y, width, height);
}
