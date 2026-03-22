import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { AdminDAL, getUserClient } from "@/lib/dal";
import AdminPageShell from "@/components/admin/AdminPageShell";
import DashboardClient from "@/components/admin/DashboardClient";

export const metadata = {
    title: "Dashboard | Admin Panel",
    description: "Activity logs and session management",
};

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ tab?: string }>;
}) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/admin/login");
    }

    const { tab } = await searchParams;
    const user = session.user as { id: string; email: string; name?: string | null; role?: string; image?: string | null };
    const client = await getUserClient(user.id, user.role ?? "ADMIN");

    // Fetch initial data server-side
    const [logsResult, sessionsResult] = await Promise.all([
        AdminDAL.getActivityLogs(client, { limit: 50, offset: 0 }),
        AdminDAL.getActiveSessions(client),
    ]);

    const activityLogs = logsResult.data ?? [];
    const activeSessions = sessionsResult.data ?? [];

    // Map session data for the client component
    const mappedSessions = activeSessions.map((s: Record<string, unknown>) => ({
        id: s.id as string,
        admin_user_id: s.admin_user_id as string,
        ip_address: s.ip_address as string | null,
        user_agent: s.user_agent as string | null,
        device_info: s.device_info as Record<string, unknown> | null,
        created_at: s.created_at as string,
        expires_at: s.expires_at as string,
        last_activity_at: s.last_activity_at as string,
        user: s.admin_user as { id: string; email: string; full_name: string | null } | undefined,
    }));

    const mappedLogs = activityLogs.map((log: Record<string, unknown>) => ({
        id: log.id as string,
        admin_user_id: log.admin_user_id as string,
        action: log.action as string,
        resource_type: log.resource_type as string,
        resource_id: log.resource_id as string | null,
        description: log.description as string | null,
        ip_address: log.ip_address as string | null,
        user_agent: log.user_agent as string | null,
        severity: log.severity as string,
        created_at: log.created_at as string,
        user: log.admin_user as { id: string; email: string; full_name: string | null } | undefined,
    }));

    // Determine initial tab
    const initialTab = tab === "sessions" ? "sessions" : "audit";

    return (
        <AdminPageShell
            user={user}
            title="Dashboard"
            subtitle="Activity Logs & Session Monitoring"
            userRole={user.role}
        >
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                {/* Pill Tab Navigation */}
                <div className="max-w-7xl mx-auto mb-6">
                    <div className="flex gap-2">
                        <Link
                            href="/admin/dashboard?tab=audit"
                            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                                initialTab === "audit"
                                    ? "bg-black text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                            Audit Logs
                        </Link>
                        <Link
                            href="/admin/dashboard?tab=sessions"
                            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                                initialTab === "sessions"
                                    ? "bg-black text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                            Active Sessions
                            {activeSessions.length > 0 && (
                                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                                    initialTab === "sessions"
                                        ? "bg-white text-black"
                                        : "bg-gray-300 text-gray-700"
                                }`}>
                                    {activeSessions.length}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>

                <DashboardClient
                    initialLogs={mappedLogs}
                    initialSessions={mappedSessions}
                    userRole={user.role}
                />
            </main>
        </AdminPageShell>
    );
}
