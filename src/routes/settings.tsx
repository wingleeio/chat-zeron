import { Button } from "@/components/ui/button";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

const navItems = [
  {
    to: "/settings",
    label: "Account",
  },
  {
    to: "/settings/preferences",
    label: "Preferences",
  },
  {
    to: "/settings/appearance",
    label: "Appearance",
  },
  {
    to: "/settings/api-key",
    label: "API Key",
  },
  {
    to: "/settings/contact",
    label: "Contact Us",
  },
];

export const Route = createFileRoute("/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex justify-center px-4 py-12">
      <div className="bg-muted p-1 rounded-lg flex gap-1 max-w-full overflow-x-auto no-scrollbar">
        {navItems.map((item) => (
          <Button
            key={item.to}
            size="sm"
            asChild
            className="bg-muted text-foreground hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50"
          >
            <Link
              to={item.to}
              activeProps={{ className: "bg-primary text-primary-foreground" }}
            >
              {item.label}
            </Link>
          </Button>
        ))}
      </div>
      <Outlet />
    </div>
  );
}
