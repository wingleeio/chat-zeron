import { Store, useStore } from "@tanstack/react-store";
import type { Tool } from "convex/ai/tools";

const store = new Store({
  drivenIds: [] as string[],
  openReasoningIds: [] as string[],
  reasoningDurations: {} as Record<string, number>,
  tool: undefined as Tool | undefined,
  openSearch: false as boolean,
});

export function useOpenSearch() {
  return useStore(store, (state) => state.openSearch);
}

export function setOpenSearch(open: boolean) {
  store.setState((prev) => ({ ...prev, openSearch: open }));
}

export function useTool() {
  return useStore(store, (state) => state.tool);
}

export function setTool(tool: Tool | undefined) {
  store.setState((prev) => ({
    ...prev,
    tool,
  }));
}

export function useDrivenIds() {
  return useStore(store, (state) => state.drivenIds);
}

export function setDrivenIds(fn: (prev: string[]) => string[]) {
  store.setState((prev) => ({
    ...prev,
    drivenIds: [...new Set(fn(prev.drivenIds))],
  }));
}

export function useIsOpenReasoning(id: string) {
  return useStore(store, (state) => state.openReasoningIds.includes(id));
}

export function openReasoning(id: string) {
  store.setState((prev) => ({
    ...prev,
    openReasoningIds: [...new Set([...prev.openReasoningIds, id])],
  }));
}

export function closeReasoning(id: string) {
  store.setState((prev) => ({
    ...prev,
    openReasoningIds: prev.openReasoningIds.filter((x) => x !== id),
  }));
}

export function useReasoningDuration(id: string) {
  return useStore(store, (state) => state.reasoningDurations[id]);
}

export function setReasoningDuration(id: string, duration: number) {
  store.setState((prev) => ({
    ...prev,
    reasoningDurations: { ...prev.reasoningDurations, [id]: duration },
  }));
}
