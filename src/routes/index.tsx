import { createFileRoute } from "@tanstack/react-router";

import { PromptInputWithActions } from "@/components/chat/prompt-input";
import { Authenticated, Unauthenticated } from "convex/react";
import { Fragment } from "react/jsx-runtime";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@clerk/tanstack-start";
import { motion } from "framer-motion";
import { AppHeader } from "@/components/app/header";
import { CodeIcon } from "lucide-react";
import { IconBrandGithub, IconBrandLine, IconTools } from "@tabler/icons-react";
import { ZeronIcon } from "@/components/icons/zeron";
import { PaginatedChatsPreloader } from "@/hooks/use-paginated-chats";
import { Suggestions } from "@/components/chat/suggestions";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  return (
    <Fragment>
      <Authenticated>
        <PaginatedChatsPreloader />
        <AppHeader />
        <div className="flex flex-col gap-6 items-center justify-center h-full pb-64 px-4">
          <h2 className="text-2xl">What&rsquo;s on your mind?</h2>
          <motion.div
            className="w-full flex flex-col items-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-full">
              <PromptInputWithActions />
            </div>
            <Suggestions />
          </motion.div>
        </div>
      </Authenticated>
      <Unauthenticated>
        <div className="flex flex-col gap-8 items-center justify-center h-full p-4 bg-sidebar lg:bg-[url(/bg.png)] bg-repeat-none bg-left-bottom bg-no-repeat">
          <div className="flex flex-col gap-4 items-center max-w-lg p-4">
            <ZeronIcon className="!size-18" />
            <div className="flex flex-col gap-2 items-center max-w-lg text-center">
              <h2 className="text-2xl font-serif">Welcome to Zeron</h2>
              <p className="text-muted-foreground text-sm">
                Zeron is an open source chat interface for models from companies
                such as Claude, DeepSeek, Gemini, OpenAI, and more.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 max-w-lg gap-4">
            <div className="h-full flex flex-col gap-2 border p-4 rounded-lg bg-background">
              <h3 className="font-semibold flex gap-2 items-center text-sm">
                <IconBrandLine className="!size-4 text-primary" /> Unified
              </h3>
              <p className="text-muted-foreground text-sm">
                Use models in one application, no need to switch between
                different platforms.
              </p>
            </div>
            <div className="h-full flex flex-col gap-2 border p-4 rounded-lg bg-background">
              <h3 className="font-semibold flex gap-2 items-center text-sm">
                <IconTools className="!size-4 text-primary" /> Tools
              </h3>
              <p className="text-muted-foreground text-sm">
                Access our tools such as search, research, and image generation.
              </p>
            </div>
            <div className="flex flex-col gap-2 border p-4 rounded-lg col-span-2 bg-background">
              <h3 className="font-semibold flex gap-2 items-center text-sm">
                <IconBrandGithub className="!size-4 text-primary" /> Open Source
              </h3>
              <p className="text-muted-foreground text-sm">
                Contribute to the project and make it better, or host it
                yourself and use it for free.
              </p>
              <div>
                <Button variant="outline" asChild>
                  <a
                    href="https://github.com/wingleeio/chat-zeron"
                    target="_blank"
                  >
                    <CodeIcon />
                    <span>View on GitHub</span>
                  </a>
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-row gap-2 max-w-lg w-full">
            <Button variant="outline" className="w-full" asChild>
              <SignInButton>
                <span>Get Started</span>
              </SignInButton>
            </Button>
          </div>
        </div>
      </Unauthenticated>
    </Fragment>
  );
}
