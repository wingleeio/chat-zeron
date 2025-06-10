import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  return (
    <div className="text-center">
      <div>what's good</div>
      <a href="/api/auth/login">Login</a>
    </div>
  );
}
