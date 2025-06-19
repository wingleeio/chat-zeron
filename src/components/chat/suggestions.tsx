import { motion } from "framer-motion";
import { setSuggestion } from "@/stores/chat";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export const suggestions = [
  "Create three images of a blonde haired black moustached man that get progressively more unhinged",
  "Write a Ted Chiang-esque short story about a man's life being changed by a browser with tabs on the side",
  "Explain the concept of metasyntactic programming language",
  "Why are all programming youtubers so incredibly handsome?",
  "Are birds real?",
  "Generate an image of someone generating an image of a cat",
];

export function Suggestions() {
  const isMobile = useIsMobile();
  if (isMobile) return null;
  return (
    <motion.div
      className={cn("mt-16 w-full max-w-lg", {
        "sm:hidden md:block": !isMobile,
      })}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex flex-col">
        {suggestions.map((suggestion, index) => (
          <button
            key={suggestion}
            onClick={() => setSuggestion(suggestion)}
            className={`py-4 cursor-pointer text-left text-foreground/80 transition-colors hover:text-foreground ${
              index !== suggestions.length - 1
                ? "border-b border-border/80"
                : ""
            }`}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
