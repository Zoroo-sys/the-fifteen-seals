import { loadImage, renderSeal } from "./sealCanvas.js";

const UPLOAD_PROMPT = "Click to upload your photo";
const UNREADABLE_PHOTO = "That file couldn't be read as an image - try another one.";

export class Certificate {
  constructor(root = document) {
    const byId = (id) => root.getElementById(id);
    this.el = {
      verifyStatus: byId("verifyStatus"),
      uploadBox: byId("uploadBox"),
      uploadLabel: byId("uploadLabel"),
      photoInput: byId("photoInput"),
      shieldWrap: byId("shieldWrap"),
      preview: byId("shieldPreview"),
      changePhoto: byId("changePhotoBtn"),
      download: byId("downloadBtn"),
    };
    this.photo = null;
    this.solveTime = "";
    this.rank = null;
    this.dataUrl = "";

    this.el.photoInput.addEventListener("change", (event) => this.handleFile(event.target.files?.[0]));
    this.el.changePhoto.addEventListener("click", () => this.el.photoInput.click());
    this.el.download.addEventListener("click", () => this.download());
  }

  setSolveTime(text) {
    this.solveTime = text;
  }

  
  awaitVerification() {
    this.el.uploadBox.classList.add("hidden");
    this.el.verifyStatus.classList.remove("hidden", "error");
    this.el.verifyStatus.textContent = "Confirming your solve with the vault…";
  }

  
  applyVerification(verified, rank) {
    if (verified) {
      this.rank = rank;
      this.el.verifyStatus.classList.add("hidden");
      this.el.uploadBox.classList.remove("hidden");
      return;
    }
    this.el.verifyStatus.classList.add("error");
    this.el.verifyStatus.textContent =
      "We couldn't confirm this run with the vault, so a seal can't be generated. If you solved this normally, try refreshing the page.";
  }

  reset() {
    this.photo = null;
    this.rank = null;
    this.dataUrl = "";
    this.el.verifyStatus.classList.add("hidden");
    this.el.shieldWrap.classList.add("hidden");
    this.el.uploadBox.classList.add("hidden");
    this.el.uploadLabel.textContent = UPLOAD_PROMPT;
    this.el.download.disabled = true;
    this.el.photoInput.value = "";
  }

  async handleFile(file) {
    if (!file) return;

    let photo;
    try {
      photo = await loadPhoto(file);
    } catch {
      this.el.uploadLabel.textContent = UNREADABLE_PHOTO;
      this.el.uploadBox.classList.remove("hidden");
      return;
    } finally {
     
      this.el.photoInput.value = "";
    }

    this.photo = photo;
    this.el.uploadBox.classList.add("hidden");
    this.el.shieldWrap.classList.remove("hidden");
    this.el.download.disabled = false;

    const rankText = this.rank ? `You are person #${this.rank} to solve it.` : "";
    this.dataUrl = await renderSeal({ photo, rankText, timeText: this.solveTime });
    this.el.preview.src = this.dataUrl;
  }

  download() {
    if (!this.dataUrl) return;
    const link = document.createElement("a");
    link.href = this.dataUrl;
    link.download = "seismic-verified-shield.png";
    document.body.append(link);
    link.click();
    link.remove();
  }
}

async function loadPhoto(file) {
  const url = URL.createObjectURL(file);
  try {
    return await loadImage(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}
