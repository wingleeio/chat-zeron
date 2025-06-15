import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "clear dangling files",
  { hours: 1 },
  internal.files.clearDangling
);

export default crons;
