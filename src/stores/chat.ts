import { Store, useStore } from "@tanstack/react-store";

const store = new Store({
  drivenIds: [] as string[],
});

export function useDrivenIds() {
  return useStore(store, (state) => state.drivenIds);
}

export function setDrivenIds(fn: (prev: string[]) => string[]) {
  store.setState((prev) => ({
    ...prev,
    drivenIds: fn(prev.drivenIds),
  }));
}
