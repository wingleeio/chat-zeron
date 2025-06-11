import { createFileRoute } from "@tanstack/react-router";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useMutation } from "@tanstack/react-query";
import { useConvexAction } from "@convex-dev/react-query";
import { api } from "convex/_generated/api";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import type { Doc } from "convex/_generated/dataModel";
import { Loader2Icon } from "lucide-react";
import { setDrivenIds } from "@/stores/chat";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const sendMessage = useMutation({
    mutationFn: useConvexAction(api.messages.send),
    onSuccess: (message: Doc<"messages">) => {
      setDrivenIds((prev) => [...prev, message._id]);
      navigate({
        to: "/c/$cid",
        params: {
          cid: message.chatId,
        },
      });
    },
  });

  return (
    <div className="text-center">
      <div>what's good {user.data?.authId}</div>
      <Button
        disabled={sendMessage.isPending}
        onClick={() =>
          sendMessage.mutate({
            prompt: "Write a 50 word story about unicorns",
          })
        }
      >
        Send Message{" "}
        {sendMessage.isPending ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : null}
      </Button>
      <a href="/api/auth/login">Login</a>
    </div>
  );
}
