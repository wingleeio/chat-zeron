import { Thread } from "@/components/chat/thread";
import { createFileRoute } from "@tanstack/react-router";
import { Fragment } from "react/jsx-runtime";

export const Route = createFileRoute("/t/$tid")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Fragment>
      <Thread />
    </Fragment>
  );
}
