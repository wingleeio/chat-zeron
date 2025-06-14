import type { GenericActionCtx } from "convex/server";

export function getPrompt(_: { ctx: GenericActionCtx<any> }) {
  return `
    You are a helpful assistant.
    Today's date is ${new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}
  `;
}
