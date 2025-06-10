import { createFileRoute } from "@tanstack/react-router";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const user = useCurrentUser();
  return (
    <div className="text-center">
      <div>what's good {user.data?.authId}</div>
      <a href="/api/auth/login">Login</a>
    </div>
  );
}
