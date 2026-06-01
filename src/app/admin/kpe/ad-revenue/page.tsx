import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AdminPageShell from "@/components/admin/AdminPageShell";
import KpeiAdRevenueClient from "@/components/admin/kpei/KpeiAdRevenueClient";

export default async function KpeAdRevenuePage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/admin/login");

    const user = session.user;
    const userRole = user.role || "ADMIN";
    if (!["SUPER_ADMIN", "ADMIN"].includes(userRole)) redirect("/admin");

    return (
        <AdminPageShell
            user={user}
            userRole={userRole}
            title="KPE Ad Revenue"
            subtitle="Ad revenue analytics and coin economy overview"
            className="flex-1 overflow-y-auto px-3 py-4 overscroll-contain sm:px-6 sm:py-6 lg:px-8 lg:py-8"
        >
            <KpeiAdRevenueClient />
        </AdminPageShell>
    );
}
