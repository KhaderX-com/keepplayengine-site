import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EarnAppsUsersClient from "@/components/admin/earn-apps/EarnAppsUsersClient";

export default async function EarnAppsUsersPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/admin/login");

    const user = session.user;
    const userRole = user.role || "ADMIN";
    if (!["SUPER_ADMIN", "ADMIN"].includes(userRole)) redirect("/admin");

    return (
        <AdminPageShell
            user={user}
            userRole={userRole}
            title="Earn Apps Users"
            subtitle="Manage users across the Earn Apps infrastructure"
            className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 overscroll-contain"
        >
            <EarnAppsUsersClient />
        </AdminPageShell>
    );
}
