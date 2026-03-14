import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserClient } from "@/lib/dal";
import AdminPageShell from "@/components/admin/AdminPageShell";
import MilestonesClient from "@/components/admin/MilestonesClient";
import { Flag } from "lucide-react";

export const metadata = {
    title: "Milestones | Admin Panel",
    description: "Track and manage project milestones",
};

export default async function MilestonesListPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/admin/login");
    }

    const user = session.user as { id: string; email: string; name?: string | null; role?: string; image?: string | null };
    const client = await getUserClient(user.id, user.role ?? "ADMIN");

    // Fetch milestone tasks server-side (same query as GET /api/milestones)
    const { data: milestoneTasks } = await client
        .from("tasks")
        .select("*, assignee:team_members!tasks_assignee_id_fkey(*), creator:team_members!tasks_created_by_fkey(*)")
        .eq("is_milestone", true)
        .order("created_at", { ascending: false });

    let milestones: Record<string, unknown>[] = [];

    if (milestoneTasks && milestoneTasks.length > 0) {
        const taskIds = milestoneTasks.map((t: { id: string }) => t.id);

        const { data: milestoneData } = await client
            .from("milestones")
            .select("*, sub_milestones(*)")
            .in("task_id", taskIds);

        milestones = milestoneTasks.map((task: { id: string }) => {
            const milestone = milestoneData?.find((m: { task_id: string }) => m.task_id === task.id);
            return {
                ...task,
                milestone: milestone || null,
                sub_milestone_count: milestone?.sub_milestones?.length || 0,
                completed_sub_milestones:
                    milestone?.sub_milestones?.filter(
                        (sm: { status: string }) => sm.status === "completed"
                    ).length || 0,
            };
        });
    }

    return (
        <AdminPageShell
            user={user}
            title="Milestones"
            subtitle="Track and manage your project milestones"
            userRole={user.role}
        >
            <main className="p-4 lg:p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                            <Flag className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Milestones
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Track and manage your project milestones
                            </p>
                        </div>
                    </div>
                </div>

                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <MilestonesClient milestones={milestones as any} />
            </main>
        </AdminPageShell>
    );
}
