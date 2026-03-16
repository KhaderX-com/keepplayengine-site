import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AdminPageShell from "@/components/admin/AdminPageShell";
import KpeUserDetailClient from "@/components/admin/kpe/KpeUserDetailClient";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function KpeUserDetailPage({ params }: Props) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        redirect("/admin/login");
    }

    const user = session.user;
    const userRole = user.role || "ADMIN";

    if (!["SUPER_ADMIN", "ADMIN"].includes(userRole)) {
        redirect("/admin");
    }

    const { id } = await params;

    return (
        <AdminPageShell
            user={user}
            userRole={userRole}
            title="User Detail"
            subtitle="KeepPlay Engine user profile"
            className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 overscroll-contain"
        >
            <KpeUserDetailClient userId={id} />
        </AdminPageShell>
    );
}
