import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AdminPageShell from "@/components/admin/AdminPageShell";
import AntiFraudClient from "@/components/admin/axiom/AntiFraudClient";

export default async function AntiFraudPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        redirect("/admin/login");
    }

    const user = session.user;
    const userRole = user.role || "ADMIN";

    if (!["SUPER_ADMIN", "ADMIN"].includes(userRole)) {
        redirect("/admin");
    }

    return (
        <AdminPageShell
            user={user}
            userRole={userRole}
            title="Anti-Fraud System"
            subtitle="Cross-layer ad revenue verification — keepplay-logs vs game-side-reports"
            className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 overscroll-contain"
        >
            <AntiFraudClient />
        </AdminPageShell>
    );
}
