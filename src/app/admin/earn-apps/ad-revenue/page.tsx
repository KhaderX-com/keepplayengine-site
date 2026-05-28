import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EarnAppsAdRevenueClient from "@/components/admin/earn-apps/EarnAppsAdRevenueClient";

export default async function EarnAppsAdRevenuePage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/admin/login");

    const user = session.user;
    const userRole = user.role || "ADMIN";
    if (!["SUPER_ADMIN", "ADMIN"].includes(userRole)) redirect("/admin");

    return (
        <AdminPageShell
            user={user}
            userRole={userRole}
            title="Earn Apps Ad Revenue"
            subtitle="Axiom revenue analytics and Supabase economy totals"
            className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 overscroll-contain"
        >
            <EarnAppsAdRevenueClient />
        </AdminPageShell>
    );
}
