export const VaultState = Object.freeze({
  DIALING: "dialing",       
  VERIFYING: "verifying",   
  BLOCKED: "blocked",      
  UNLOCKING: "unlocking",   
  VICTORY: "victory",       
});

const TRANSITIONS = {
  [VaultState.DIALING]: [VaultState.VERIFYING],
  [VaultState.VERIFYING]: [VaultState.DIALING, VaultState.BLOCKED, VaultState.UNLOCKING],
  [VaultState.BLOCKED]: [VaultState.VERIFYING],
  [VaultState.UNLOCKING]: [VaultState.DIALING, VaultState.VICTORY],
  [VaultState.VICTORY]: [],
};

export function assertValidTransition(current, next) {
  const allowed = TRANSITIONS[current];
  if (!allowed) throw new Error(`unknown state "${current}"`);
  if (!allowed.includes(next)) {
    throw new Error(`invalid transition: ${current} -> ${next}`);
  }
}
