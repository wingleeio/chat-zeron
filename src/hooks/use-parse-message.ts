import { parseRawTextIntoUIMessages } from "@/lib/utils";
import type { UIMessage } from "ai";
import { useMemo } from "react";

export function useParseMessage(text: string): UIMessage[] {
  return useMemo(() => {
    return parseRawTextIntoUIMessages(text);
  }, [text]);
}
