import { STORAGE_KEYS } from "./config.js";


export function readItem(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeItem(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
   
  }
}

export function removeItem(key) {
  try {
    localStorage.removeItem(key);
  } catch {
   
  }
}

export function loadProgress(total) {
  const saved = parseInt(readItem(STORAGE_KEYS.progress), 10);
  return Number.isInteger(saved) && saved >= 0 && saved <= total ? saved : 0;
}


export function loadOrCreateSessionId() {
  const existing = readItem(STORAGE_KEYS.sessionId);
  if (existing) return existing;
  const created = crypto.randomUUID();
  writeItem(STORAGE_KEYS.sessionId, created);
  return created;
}
