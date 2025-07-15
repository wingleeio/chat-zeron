import { Store, useStore } from "@tanstack/react-store";
import type { Tool } from "convex/ai/schema";

type R2File = {
  key: string;
  name: string;
};

const store = new Store({
  drivenIds: [] as string[],
  openReasoningIds: [] as string[],
  reasoningDurations: {} as Record<string, number>,
  tool: undefined as Tool | undefined,
  openSearch: false as boolean,
  input: "" as string,
  files: [] as R2File[],
});

export function useFiles() {
  const value = useStore(store, (state) => state.files);
  return [value, setFiles] as const;
}

function setFiles(files: R2File[] | ((prev: R2File[]) => R2File[])) {
  store.setState((prev) => ({
    ...prev,
    files: typeof files === "function" ? files(prev.files) : files,
  }));
}

export function useInput() {
  const value = useStore(store, (state) => state.input);
  return [value, setInput] as const;
}

export function setInput(input: string) {
  store.setState((prev) => ({ ...prev, input }));
}

export const useChatStore = () => useStore(store);

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
  return useStore(
    store,
    (state) => state.openReasoningIds.includes(id) || undefined
  );
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
