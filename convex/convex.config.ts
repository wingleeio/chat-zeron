import { defineApp } from "convex/server";
import persistentTextStreaming from "@convex-dev/persistent-text-streaming/convex.config";
import r2 from "@convex-dev/r2/convex.config";
import polar from "@convex-dev/polar/convex.config";
import migrations from "@convex-dev/migrations/convex.config";

const app = defineApp();

app.use(persistentTextStreaming);
app.use(r2);
app.use(polar);
app.use(migrations);

export default app;
