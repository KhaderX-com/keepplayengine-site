import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AdminPageShell from "@/components/admin/AdminPageShell";
import PayPalPayoutsClient from "@/components/admin/paypal/PayPalPayoutsClient";

export default async function PayPalPayoutsPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/admin/login");

    const user = session.user;
    const userRole = user.role || "ADMIN";
    if (!["SUPER_ADMIN", "ADMIN"].includes(userRole)) redirect("/admin");

    return (
        <AdminPageShell
            user={user}
            userRole={userRole}
            title="PayPal Payouts"
            subtitle="Create PayPal payout batches and inspect payout status"
            className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 overscroll-contain"
        >
            <PayPalPayoutsClient />
        </AdminPageShell>
    );
}
