import { Copy, Link } from "lucide-react";
import { toast } from "sonner";
import { memo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Doc, Id } from "convex/_generated/dataModel";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import { Switch } from "@/components/ui/switch";

function NonMemoizedChatShareModal({
  id,
  messageId,
  children,
}: {
  id: Id<"chats">;
  messageId?: string;
  children?: React.ReactNode;
}) {
  const chatQuery = convexQuery(api.chats.getById, {
    clientId: id,
  });
  const { data: chat } = useSuspenseQuery(chatQuery);

  const queryClient = useQueryClient();
  const togglePublic = useMutation({
    mutationFn: useConvexMutation(api.chats.togglePublic),
    onMutate: () => {
      queryClient.setQueryData(chatQuery.queryKey, (old: Doc<"chats">) => {
        return {
          ...old,
          isPublic: !old.isPublic,
        };
      });
    },
  });
  const baseUrl = window.location.origin;
  const shareableLink = `${baseUrl}/c/${id}${messageId ? `#m-${messageId}` : ""}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareableLink);
    toast.success("Link copied to clipboard!");
  };

  const onCheckedChange = useCallback(() => {
    togglePublic.mutate({
      chatId: id,
    });
  }, [chat?.isPublic, togglePublic, id]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Link className="mr-2" size={16} /> Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="p-6" aria-describedby="share chat">
        <DialogHeader>
          <DialogTitle>Share Link</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              value={shareableLink}
              readOnly
              className="text-md flex-1"
              disabled={!chat?.isPublic}
            />
            <Button
              onClick={copyToClipboard}
              size="icon"
              variant="outline"
              disabled={!chat?.isPublic}
            >
              <Copy size={16} />
            </Button>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Make chat public</span>
            <Switch
              checked={chat?.isPublic}
              onCheckedChange={onCheckedChange}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const ShareModal = memo(NonMemoizedChatShareModal);
