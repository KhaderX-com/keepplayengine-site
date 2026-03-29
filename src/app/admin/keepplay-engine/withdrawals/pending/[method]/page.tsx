import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AdminPageShell from "@/components/admin/AdminPageShell";
import WithdrawalsClient from "@/components/admin/kpe/WithdrawalsClient";

const VALID_METHODS = ["paypal", "binance", "coinbase"];

interface Props {
    params: Promise<{ method: string }>;
}

// /admin/keepplay-engine/withdrawals/pending/[method]
export default async function WithdrawalsPendingMethodPage({ params }: Props) {
    const { method } = await params;

    if (!VALID_METHODS.includes(method)) {
        redirect("/admin/keepplay-engine/withdrawals/pending");
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/admin/login");

    const user = session.user;
    const userRole = user.role || "ADMIN";
    if (!["SUPER_ADMIN", "ADMIN"].includes(userRole)) redirect("/admin");

    return (
        <AdminPageShell
            user={user}
            userRole={userRole}
            title="Withdrawals"
            subtitle="Manage withdrawal requests, approve/reject, and view analytics"
            className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 overscroll-contain"
        >
            <WithdrawalsClient initialTab="requests" initialMethod={method} />
        </AdminPageShell>
    );
}
