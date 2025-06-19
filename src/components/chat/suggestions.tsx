import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useInput } from "@/stores/chat";
import { useState } from "react";
import { GlobeIcon, CodeIcon, BookIcon, SparklesIcon } from "lucide-react";

const suggestionGroups = {
  create: [
    "Create three images of a blonde haired black moustached man that get progressively more unhinged",
    "Generate an image of someone generating an image of a cat",
    "Design a futuristic cityscape with flying cars",
    "Create a logo for a sustainable coffee shop",
  ],
  explore: [
    "Why are all programming youtubers so incredibly handsome?",
    "Are birds real?",
    "What would happen if we could communicate with plants?",
    "Explain quantum computing in simple terms",
  ],
  code: [
    "Write a function to reverse a string in JavaScript",
    "Create a React component for a todo list",
    "Explain the concept of metasyntactic programming language",
    "Debug this Python code: print('Hello World)",
  ],
  learn: [
    "Write a Ted Chiang-esque short story about a man's life being changed by a browser with tabs on the side",
    "Teach me about machine learning basics",
    "Explain the history of the internet",
    "What are the fundamentals of design thinking?",
  ],
};

const tabLabels = {
  create: "Create",
  explore: "Explore",
  code: "Code",
  learn: "Learn",
};

const tabIcons = {
  create: <SparklesIcon className="size-4" />,
  explore: <GlobeIcon className="size-4" />,
  code: <CodeIcon className="size-4" />,
  learn: <BookIcon className="size-4" />,
};

export function Suggestions() {
  const [input, setInput] = useInput();
  const [activeTab, setActiveTab] =
    useState<keyof typeof suggestionGroups>("create");

  return (
    <motion.div
      className={cn(
        "mt-8 px-2 w-full max-w-xl flex flex-col items-center justify-center",
        input && "pointer-events-none"
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: input ? 0 : 1,
        y: input ? -10 : 0,
      }}
      transition={{ duration: 0.3 }}
    >
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {Object.entries(tabLabels).map(([key, label]) => (
          <button
            key={key}
            className={cn(
              "md:flex-row md:w-auto md:px-6 md:h-8 md:gap-2",
              "rounded-2xl flex flex-col text-sm gap-1 border items-center justify-center w-16 h-16 border-border bg-muted/50 cursor-pointer hover:bg-muted/80 transition-all duration-200",
              activeTab === key &&
                "bg-primary border-primary hover:bg-primary/80 text-primary-foreground"
            )}
            onClick={() => setActiveTab(key as keyof typeof suggestionGroups)}
          >
            {tabIcons[key as keyof typeof tabIcons]}
            <span className="text-xs">{label}</span>
          </button>
        ))}
      </div>

      {/* Suggestions */}
      <motion.div
        key={activeTab}
        className="flex flex-col"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {suggestionGroups[activeTab].map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => setInput(suggestion)}
            className={cn(
              "text-sm py-4 cursor-pointer text-left text-foreground/80 transition-colors hover:text-foreground last:border-b-0 border-b border-border/80"
            )}
          >
            {suggestion}
          </button>
        ))}
      </motion.div>
    </motion.div>
  );
}
