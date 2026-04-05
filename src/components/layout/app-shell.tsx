import { DesktopNav, MobileNav } from "./nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-screen">
      <DesktopNav />
      <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
