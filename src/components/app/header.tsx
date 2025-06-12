import { SidebarTrigger } from "@/components/ui/sidebar";

export function AppHeader() {
  return (
    <header className="p-4 absolute top-0 left-0 right-0">
      <SidebarTrigger />
    </header>
  );
}
