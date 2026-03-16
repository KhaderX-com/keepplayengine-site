import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { kpeAdmin, type KpeDashboardStats } from "@/lib/supabase-kpe";
import { KpeStatsDAL } from "@/lib/kpe-dal";
import AdminPageShell from "@/components/admin/AdminPageShell";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function KpeOverviewPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        redirect("/admin/login");
    }

    const user = session.user;
    const userRole = user.role || "ADMIN";

    // Only SUPER_ADMIN and ADMIN can access KPE
    if (!["SUPER_ADMIN", "ADMIN"].includes(userRole)) {
        redirect("/admin");
    }

    let stats: KpeDashboardStats | null = null;

    try {
        const res = await KpeStatsDAL.getDashboardStats(kpeAdmin);
        if (res.data?.success) {
            stats = res.data;
        }
    } catch (error) {
        console.error("Error fetching KPE dashboard stats:", error);
    }

    const statCards = [
        {
            title: "Total Users",
            value: stats?.total_users ?? 0,
            gradient: "from-blue-500 to-blue-700",
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            href: "/admin/keepplay-engine/users",
        },
        {
            title: "Active Users",
            value: stats?.active_users ?? 0,
            gradient: "from-green-500 to-green-700",
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
        {
            title: "Total Balance",
            value: stats?.total_balance ?? 0,
            gradient: "from-amber-500 to-amber-700",
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
        {
            title: "Pending Withdrawals",
            value: stats?.pending_withdrawals ?? 0,
            gradient: "from-red-500 to-red-700",
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
        {
            title: "Today&apos;s Registrations",
            value: stats?.today_registrations ?? 0,
            gradient: "from-purple-500 to-purple-700",
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
            ),
        },
        {
            title: "Today&apos;s Ad Events",
            value: stats?.today_ad_events ?? 0,
            gradient: "from-cyan-500 to-cyan-700",
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            ),
        },
    ];

    return (
        <AdminPageShell
            user={user}
            userRole={userRole}
            title="KeepPlay Engine"
            subtitle="Loyalty program overview and management"
            className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 overscroll-contain"
        >
            <div className="max-w-7xl mx-auto">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {statCards.map((card) => {
                        const content = (
                            <Card key={card.title} className="overflow-hidden hover:shadow-lg transition-shadow">
                                <CardHeader className={`bg-gradient-to-r ${card.gradient} text-white pb-3`}>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-medium text-white/90">
                                            {card.title}
                                        </CardTitle>
                                        <div className="text-white/80">{card.icon}</div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="text-2xl font-bold text-gray-900">
                                        {card.title === "Total Balance" ? (
                                            <span className="inline-flex items-center gap-1.5">
                                                <img src="https://res.cloudinary.com/destej60y/image/upload/v1773604391/coin_j3p6w0.png" alt="coins" className="w-6 h-6" />
                                                {typeof card.value === "number" ? card.value.toLocaleString() : card.value}
                                            </span>
                                        ) : (
                                            typeof card.value === "number" ? card.value.toLocaleString() : card.value
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                        if (card.href) {
                            return (
                                <Link key={card.title} href={card.href} className="block">
                                    {content}
                                </Link>
                            );
                        }
                        return content;
                    })}
                </div>

                {/* Quick Links */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Link href="/admin/keepplay-engine/users">
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                            <CardContent className="flex items-center gap-4 py-6">
                                <div className="bg-blue-100 rounded-lg p-3">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">User Management</h3>
                                    <p className="text-sm text-gray-500">View and manage loyalty app users</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </div>
        </AdminPageShell>
    );
}
