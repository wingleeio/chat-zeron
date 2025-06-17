import { AnimatePresence, motion } from "framer-motion";
import type { ImageGenerationAnnotation } from "convex/ai/tools";

type ChatImageResultProps = {
  result?: {
    prompt: string;
    imageUrl: string;
  };
  annotations: ImageGenerationAnnotation[];
  animate?: boolean;
};

export function ChatImageResult({
  result,
  annotations,
  animate,
}: ChatImageResultProps) {
  const annotation = annotations[0];
  const imageUrl = result?.imageUrl ?? annotation?.data.imageUrl;

  if (!imageUrl) {
    return (
      <div className="relative mb-4 flex w-full flex-col gap-2 rounded-xl bg-muted p-4">
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <div className="font-medium">Generating Image...</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="h-64 w-64 animate-pulse rounded-md bg-muted-foreground/20"></div>
        </div>
      </div>
    );
  }
  const content = (
    <div className="relative mb-4 flex w-full flex-col gap-2 rounded-xl p-4">
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
          <div className="font-medium">Image Generated</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <img src={imageUrl} alt={result?.prompt} className="rounded-md" />
      </div>
    </div>
  );

  return animate ? (
    <AnimatePresence>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 50 }}
      >
        {content}
      </motion.div>
    </AnimatePresence>
  ) : (
    content
  );
}
