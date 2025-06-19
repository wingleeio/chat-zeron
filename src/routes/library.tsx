import { AppHeader } from "@/components/app/header";
import { createFileRoute } from "@tanstack/react-router";
import { Fragment } from "react/jsx-runtime";
import { usePaginatedQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { X, MessageSquare, Loader2Icon, ImageIcon } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { Doc } from "../../convex/_generated/dataModel";

export const Route = createFileRoute("/library")({
  component: RouteComponent,
});

function ImageCard({
  file,
  onClick,
}: {
  file: Doc<"files"> & { message?: Doc<"messages"> | null; url: string };
  onClick: () => void;
}) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div
      className="aspect-square rounded overflow-hidden cursor-pointer hover:opacity-90 transition-opacity relative"
      onClick={onClick}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Loader2Icon className="size-6 animate-spin" />
        </div>
      )}
      <img
        src={file.url}
        alt="AI Generated"
        className="w-full h-full object-cover"
        onLoad={() => setIsLoading(false)}
        onError={() => setIsLoading(false)}
      />
    </div>
  );
}

function ImageSkeleton() {
  return (
    <div className="aspect-square rounded overflow-hidden">
      <Skeleton className="w-full h-full" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-4 pb-12 text-center h-full">
      <div className="bg-muted rounded-full p-6 mb-4">
        <ImageIcon className="size-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No images yet</h3>
      <p className="text-muted-foreground max-w-md">
        Start a conversation to generate images. They'll appear here once
        created.
      </p>
    </div>
  );
}

function RouteComponent() {
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    chatId?: string;
  } | null>(null);
  const [isModalImageLoading, setIsModalImageLoading] = useState(true);
  const navigate = useNavigate();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const images = usePaginatedQuery(
    api.files.getGeneratedByAgentImagesPaginated,
    {},
    { initialNumItems: 20 }
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting && images.status === "CanLoadMore") {
          images.loadMore(20);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [images]);

  const handleImageClick = (
    file: Doc<"files"> & { message?: Doc<"messages"> | null; url: string }
  ) => {
    setSelectedImage({
      url: file.url,
      chatId: file.message?.chatId,
    });
    setIsModalImageLoading(true);
  };

  const handleChatNavigation = () => {
    if (selectedImage?.chatId) {
      navigate({
        to: "/c/$cid",
        params: { cid: selectedImage.chatId },
      });
    }
  };

  return (
    <Fragment>
      <AppHeader />
      <div className="flex-1 p-1 overflow-auto">
        {images.status === "LoadingFirstPage" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1">
            {Array.from({ length: 20 }).map((_, i) => (
              <ImageSkeleton key={i} />
            ))}
          </div>
        ) : images.results.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1">
              {images.results.map((file) => (
                <ImageCard
                  key={file._id}
                  file={file}
                  onClick={() => handleImageClick(file)}
                />
              ))}
            </div>

            {images.status === "CanLoadMore" && (
              <div ref={loadMoreRef} className="min-h-12 w-full" />
            )}

            {images.status === "LoadingMore" && (
              <div className="flex justify-center p-4">
                <Loader2Icon className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </>
        )}
      </div>

      <Dialog
        open={!!selectedImage}
        onOpenChange={() => setSelectedImage(null)}
      >
        <DialogContent
          className="max-w-[95vw] max-h-[95vh] p-0 bg-transparent border-none"
          showCloseButton={false}
        >
          <div className="relative w-full h-full">
            <div className="absolute top-4 right-4 z-50 flex gap-2">
              {selectedImage?.chatId && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-background/80 hover:bg-background dark:hover:bg-background/70"
                      onClick={handleChatNavigation}
                    >
                      <MessageSquare className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Go to chat</p>
                  </TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-background/80 hover:bg-background dark:hover:bg-background/70"
                    onClick={() => setSelectedImage(null)}
                  >
                    <X className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Close</p>
                </TooltipContent>
              </Tooltip>
            </div>
            {selectedImage && (
              <div className="relative w-full h-full">
                {isModalImageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <Loader2Icon className="size-6 animate-spin" />
                  </div>
                )}
                <img
                  src={selectedImage.url}
                  alt="AI Generated"
                  className="w-full h-full object-contain"
                  onLoad={() => setIsModalImageLoading(false)}
                  onError={() => setIsModalImageLoading(false)}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Fragment>
  );
}
