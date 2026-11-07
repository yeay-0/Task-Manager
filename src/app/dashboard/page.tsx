import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import TaskManager from "@/components/TaskManager";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login"); // proteksi halaman

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <h1 className="font-semibold text-gray-900">Task Manager</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Halo, {user.name}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <TaskManager />
      </main>
    </div>
  );
}
export const instant = false;