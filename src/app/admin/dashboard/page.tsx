import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
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
    const [logsResult, sessionsResult, statsResult] = await Promise.all([
        AdminDAL.getActivityLogs(client, { limit: 50, offset: 0 }),
        AdminDAL.getActiveSessions(client),
        AdminDAL.getDashboardStats(client),
    ]);

    const activityLogs = logsResult.data ?? [];
    const activeSessions = sessionsResult.data ?? [];
    const stats = statsResult.data as { activeSessions?: number } | null;

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
            activeSessions={stats?.activeSessions ?? activeSessions.length}
            userRole={user.role}
        >
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                {/* Tab Navigation */}
                <div className="max-w-7xl mx-auto mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            <a
                                href="/admin/dashboard?tab=audit"
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                                    initialTab === "audit"
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                            >
                                <svg className="w-5 h-5 inline mr-2 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Audit Logs
                            </a>
                            <a
                                href="/admin/dashboard?tab=sessions"
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                                    initialTab === "sessions"
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                            >
                                <svg className="w-5 h-5 inline mr-2 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                Active Sessions ({activeSessions.length})
                            </a>
                        </nav>
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
