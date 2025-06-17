import type { ImageGenerationAnnotation } from "convex/ai/tools";
import { match } from "ts-pattern";
import { Loader2Icon, X } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type ChatImageResultProps = {
  annotations: ImageGenerationAnnotation[];
};

export function ChatImageResult({ annotations }: ChatImageResultProps) {
  const annotation = annotations[annotations.length - 1];
  const [isOpen, setIsOpen] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);

  return (
    <>
      {match(annotation?.data)
        .with({ status: "completed" }, ({ imageUrl, prompt }) => (
          <div className="h-75 w-100 max-w-full flex items-center justify-center gap-2 bg-muted rounded-md">
            <div
              className="w-full h-full cursor-pointer relative"
              onClick={() => setIsOpen(true)}
            >
              {isImageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <Loader2Icon className="size-6 animate-spin" />
                </div>
              )}
              <img
                src={imageUrl}
                alt={prompt}
                className="rounded-md w-full h-full object-cover"
                onLoad={() => setIsImageLoading(false)}
                onError={() => setIsImageLoading(false)}
              />
            </div>
          </div>
        ))
        .with({ status: "failed" }, () => null)
        .otherwise(() => (
          <div className="h-75 w-100 flex items-center justify-center gap-2 bg-muted rounded-md">
            <Loader2Icon className="size-6 animate-spin" />
          </div>
        ))}

      {annotation?.data.status === "completed" && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent
            className="max-w-[95vw] max-h-[95vh] p-0 bg-transparent border-none"
            showCloseButton={false}
          >
            <div className="relative w-full h-full">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-50 bg-background/80 hover:bg-background"
                onClick={() => setIsOpen(false)}
              >
                <X className="size-4" />
              </Button>
              {isImageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <Loader2Icon className="size-6 animate-spin" />
                </div>
              )}
              <img
                src={annotation.data.imageUrl}
                alt={annotation.data.prompt}
                className="w-full h-full object-contain"
                onLoad={() => setIsImageLoading(false)}
                onError={() => setIsImageLoading(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
