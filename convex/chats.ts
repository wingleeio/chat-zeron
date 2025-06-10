import type { StreamId } from "@convex-dev/persistent-text-streaming";
import { httpAction } from "convex/_generated/server";
import { streamingComponent } from "convex/streaming";

export const streamChat = httpAction(async (ctx, request) => {
  const body: {
    streamId: StreamId;
  } = await request.json();

  return await streamingComponent.stream(
    ctx,
    request,
    body.streamId,
    async (ctx, request, StreamIdValidator, append) => {}
  );
});
