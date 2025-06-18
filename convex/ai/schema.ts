import { v, type Infer } from "convex/values";

export const vTool = v.union(
  v.literal("search"),
  v.literal("image"),
  v.literal("research")
);
export type Tool = Infer<typeof vTool>;
