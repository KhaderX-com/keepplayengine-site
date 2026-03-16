import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AdminPageShell from "@/components/admin/AdminPageShell";
import AppKeysClient from "@/components/admin/kpe/AppKeysClient";

export default async function AppKeysPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        redirect("/admin/login");
    }

    const user = session.user;
    const userRole = user.role || "ADMIN";

    if (!["SUPER_ADMIN"].includes(userRole)) {
        redirect("/admin");
    }

    return (
        <AdminPageShell
            user={user}
            userRole={userRole}
            title="App Keys"
            subtitle="Manage API gateway authentication keys for games and services"
            className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 overscroll-contain"
        >
            <AppKeysClient />
        </AdminPageShell>
    );
}
