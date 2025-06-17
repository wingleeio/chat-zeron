import { createFileRoute } from "@tanstack/react-router";

import { PromptInputWithActions } from "@/components/chat/prompt-input";
import { Authenticated, Unauthenticated } from "convex/react";
import { Fragment } from "react/jsx-runtime";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@clerk/tanstack-start";
import { motion } from "framer-motion";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  return (
    <Fragment>
      <Authenticated>
        <div className="flex flex-col gap-6 items-center justify-center h-full pb-64 px-4">
          <h2 className="text-2xl">What's on your mind</h2>
          <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <PromptInputWithActions />
          </motion.div>
        </div>
      </Authenticated>
      <Unauthenticated>
        <div className="flex flex-col gap-6 items-center justify-center h-full">
          <h2 className="text-2xl">Please sign in to continue</h2>
          <Button variant="outline" asChild>
            <SignInButton />
          </Button>
        </div>
      </Unauthenticated>
    </Fragment>
  );
}
