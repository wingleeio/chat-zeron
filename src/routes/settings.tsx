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
];

export const Route = createFileRoute("/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col gap-4 px-4 py-12 flex-1 overflow-y-auto">
      <div className="flex justify-center">
        <div className="bg-muted p-1 rounded-lg flex gap-1 max-w-full overflow-x-auto no-scrollbar">
          {navItems.map((item) => (
            <Button
              key={item.to}
              size="sm"
              asChild
              className="bg-muted text-foreground hover:bg-primary/50 dark:hover:bg-primary/50 shadow-none"
            >
              <Link
                to={item.to}
                activeOptions={{ exact: true }}
                activeProps={{
                  className: "bg-primary text-primary-foreground",
                }}
              >
                {item.label}
              </Link>
            </Button>
          ))}
        </div>
      </div>
      <div className="w-full md:max-w-3xl mx-auto flex-1 py-8">
        <Outlet />
      </div>
    </div>
  );
}
