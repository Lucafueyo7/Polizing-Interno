import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { Sidebar } from "./_components/sidebar";
import { Topbar } from "./_components/topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="grid grid-cols-[auto_1fr] min-h-svh bg-background">
      <Sidebar user={user} />
      <main className="flex flex-col min-w-0">
        <Topbar />
        <div className="p-7 flex-1 min-w-0">{children}</div>
      </main>
    </div>
  );
}
