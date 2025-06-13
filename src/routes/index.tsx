import { createFileRoute } from "@tanstack/react-router";

import { PromptInputWithActionsNewChat } from "@/components/chat/prompt-input";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  return (
    <div className="flex flex-col gap-6 items-center justify-center h-full pb-64 px-4">
      <h2 className="text-2xl">What's on your mind</h2>
      <PromptInputWithActionsNewChat />
    </div>
  );
}
