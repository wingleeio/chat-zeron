import { createFileRoute } from "@tanstack/react-router";

import { PromptInputWithActionsNewChat } from "@/components/chat/prompt-input";
import { Authenticated, Unauthenticated } from "convex/react";
import { SignInButton } from "@clerk/tanstack-react-start";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  return (
    <div className="flex flex-col gap-6 items-center justify-center h-full pb-64 px-12">
      <Authenticated>
        <h2 className="text-2xl">What's on your mind</h2>
        <PromptInputWithActionsNewChat />
      </Authenticated>
      <Unauthenticated>
        <div className="flex flex-col gap-6 items-center justify-center h-full">
          <h2 className="text-2xl">Please sign in to continue</h2>
          <Button variant="outline" asChild>
            <SignInButton />
          </Button>
        </div>
      </Unauthenticated>
    </div>
  );
}
