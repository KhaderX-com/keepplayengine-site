import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { kpeAdmin, type KpeDashboardStats } from "@/lib/supabase-kpe";
import { KpeStatsDAL } from "@/lib/kpe-dal";
import AdminPageShell from "@/components/admin/AdminPageShell";
import Image from "next/image";
import type { ReactNode } from "react";

function StatCard({
    label,
    value,
    iconBg,
    icon,
}: {
    label: string;
    value: ReactNode;
    iconBg: string;
    icon: ReactNode;
}) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 flex flex-col gap-5">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                {icon}
            </div>
            <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">{label}</p>
                <p className="text-3xl font-bold text-gray-900 tracking-tight leading-none">{value}</p>
            </div>
        </div>
    );
}

export default async function KpeOverviewPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/admin/login");

    const user = session.user;
    const userRole = user.role || "ADMIN";

    if (!["SUPER_ADMIN", "ADMIN"].includes(userRole)) redirect("/admin");

    let stats: KpeDashboardStats | null = null;

    try {
        const res = await KpeStatsDAL.getDashboardStats(kpeAdmin);
        if (res.data?.success) stats = res.data;
    } catch (error) {
        console.error("Error fetching KPE dashboard stats:", error);
    }

    const totalUsers = stats?.total_users ?? 0;
    const activeUsers = stats?.active_users ?? 0;
    const totalBalance = stats?.total_balance ?? 0;
    const pendingWithdrawals = stats?.pending_withdrawals ?? 0;
    const todayRegistrations = stats?.today_registrations ?? 0;
    const todayAdEvents = stats?.today_ad_events ?? 0;

    return (
        <AdminPageShell
            user={user}
            userRole={userRole}
            title="KeepPlay Engine"
            subtitle="Loyalty program overview and management"
            className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8 overscroll-contain"
        >
            <div className="max-w-5xl mx-auto space-y-10">

                {/* Section: Users */}
                <section>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-4">Users</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <StatCard
                            label="Total Users"
                            value={totalUsers.toLocaleString()}
                            iconBg="bg-blue-50"
                            icon={
                                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            }
                        />
                        <StatCard
                            label="Active Users"
                            value={activeUsers.toLocaleString()}
                            iconBg="bg-emerald-50"
                            icon={
                                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            }
                        />
                        <StatCard
                            label="Today's Registrations"
                            value={todayRegistrations.toLocaleString()}
                            iconBg="bg-violet-50"
                            icon={
                                <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                            }
                        />
                    </div>
                </section>

                {/* Section: Finance & Activity */}
                <section>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-4">Finance &amp; Activity</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <StatCard
                            label="Total Balance"
                            value={
                                <span className="inline-flex items-center gap-2">
                                    <Image
                                        src="https://res.cloudinary.com/destej60y/image/upload/v1773604391/coin_j3p6w0.png"
                                        alt="coins"
                                        width={28}
                                        height={28}
                                    />
                                    {totalBalance.toLocaleString()}
                                </span>
                            }
                            iconBg="bg-amber-50"
                            icon={
                                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            }
                        />
                        <StatCard
                            label="Pending Withdrawals"
                            value={pendingWithdrawals.toLocaleString()}
                            iconBg="bg-red-50"
                            icon={
                                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            }
                        />
                        <StatCard
                            label="Today's Ad Events"
                            value={todayAdEvents.toLocaleString()}
                            iconBg="bg-sky-50"
                            icon={
                                <svg className="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            }
                        />
                    </div>
                </section>

            </div>
        </AdminPageShell>
    );
}

