import { WORKER_URL, SEAL_ID_BASE } from "./config.js";

export function checkGuess(sealIndex, guess, sid, proof) {
  return post({ sealId: sealIndex + SEAL_ID_BASE, guess, sid, proof });
}


export function verifyCompletion(sid, proof) {
  return post({ action: "verify", sid, proof });
}

async function post(body) {
  const response = await fetch(WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (response.status === 429) {
    const errorBody = await response.json().catch(() => ({}));
    const retryAfter = Number(errorBody.retryAfter) || Number(response.headers.get("Retry-After")) || 30;
    return { status: "limited", retryAfter };
  }
  if (!response.ok) throw new Error(`worker replied HTTP ${response.status}`);
  return response.json();
}
