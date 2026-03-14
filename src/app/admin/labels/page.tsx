import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AdminPageShell from "@/components/admin/AdminPageShell";
import LabelManagement from "@/components/admin/LabelManagement";

export default async function LabelsPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/admin/login");
    }

    // Only SUPER_ADMIN can access this page
    if (session.user.role !== "SUPER_ADMIN") {
        redirect("/admin");
    }

    return (
        <AdminPageShell
            user={session.user}
            userRole={session.user.role}
            title="Label Management"
            subtitle="Manage task labels for better organization"
            className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pt-6 lg:pt-8"
        >
            <LabelManagement />
        </AdminPageShell>
    );
}
