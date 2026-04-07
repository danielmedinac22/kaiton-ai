import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { athlete } from "@/lib/db/schema";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [a] = await db.select({ id: athlete.id }).from(athlete).limit(1);
  if (!a) redirect("/onboarding");

  return <AppShell>{children}</AppShell>;
}
