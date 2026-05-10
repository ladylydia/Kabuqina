import { useSyncExternalStore } from "react";

let state = false;
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return state;
}

export function usePowerUser() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function getPowerUserSnapshot(): boolean {
  return state;
}

export function setPowerUser(v: boolean) {
  state = v;
  listeners.forEach((cb) => cb());
}
