import { parseDataStreamPart } from "ai";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function lazy<T>(fn: () => T): () => T {
  let called = false;
  let result: T;
  return () => {
    if (!called) {
      result = fn();
      called = true;
    }
    return result;
  };
}

export function parseDataStream(text: string) {
  return text
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => {
      if (line.split(":")[1] !== "undefined") {
        return parseDataStreamPart(line);
      }
    })
    .filter((part) => part != null);
}
