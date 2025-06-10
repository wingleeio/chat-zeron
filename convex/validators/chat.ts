import { v, type Infer } from "convex/values";

export const vStatus = v.union(
  v.literal("ready"),
  v.literal("submitted"),
  v.literal("streaming")
);

export type Status = Infer<typeof vStatus>;
