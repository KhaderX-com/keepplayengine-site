"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Stats {
    totalUsers: number;
    activeSessions: number;
    recentLogins: number;
    failedAttempts: number;
    totalTasks?: number;
    completedTasks?: number;
    pendingTasks?: number;
    labels?: number;
}

interface DashboardCard {
    title: string;
    description: string;
    href: string;
    icon: React.ReactNode;
    gradient: string;
    stat?: string | number;
    statLabel?: string;
    badge?: string;
}

export default function AdminPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [userRole, setUserRole] = useState<string>('ADMIN');

    const handleToggleMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    }, [isMobileMenuOpen]);

    const handleCloseMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(false);
    }, []);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/admin/login");
        }
    }, [status, router]);

    useEffect(() => {
        if (session) {
            fetchDashboardStats();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setUserRole((session.user as any)?.role || 'ADMIN');
        }
    }, [session]);

    const fetchDashboardStats = async () => {
        setIsLoading(true);
        try {
            const [statsRes, tasksRes] = await Promise.all([
                fetch("/api/admin/stats"),
                fetch("/api/tasks").catch(() => null)
            ]);

            if (statsRes.ok) {
                const statsData = await statsRes.json();

                let taskStats = { totalTasks: 0, completedTasks: 0, pendingTasks: 0 };
                if (tasksRes?.ok) {
                    const tasksData = await tasksRes.json();
                    taskStats = {
                        totalTasks: tasksData.tasks?.length || 0,
                        completedTasks: tasksData.tasks?.filter((t: { status: string }) => t.status === 'completed').length || 0,
                        pendingTasks: tasksData.tasks?.filter((t: { status: string }) => t.status !== 'completed').length || 0,
                    };
                }

                setStats({
                    ...statsData,
                    ...taskStats,
                    labels: 0,
                });
            }
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const dashboardCards: DashboardCard[] = [
        {
            title: "System Monitoring",
            description: "View audit logs and track system activities",
            href: "/admin/dashboard?tab=audit",
            gradient: "from-blue-500 to-blue-700",
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            ),
            stat: stats?.recentLogins || 0,
            statLabel: "Recent Activities",
        },
        {
            title: "Active Sessions",
            description: "Monitor and manage user sessions",
            href: "/admin/dashboard?tab=sessions",
            gradient: "from-green-500 to-green-700",
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
            stat: stats?.activeSessions || 0,
            statLabel: "Active Now",
            badge: stats?.activeSessions ? String(stats.activeSessions) : undefined,
        },
        {
            title: "Task Board",
            description: "Manage tasks with kanban board view",
            href: "/admin/tasks",
            gradient: "from-purple-500 to-purple-700",
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
            ),
            stat: stats?.totalTasks || 0,
            statLabel: "Total Tasks",
        },
        {
            title: "My Tasks",
            description: "View and manage tasks assigned to you",
            href: "/admin/tasks?filter=mine",
            gradient: "from-orange-500 to-orange-700",
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            ),
            stat: stats?.pendingTasks || 0,
            statLabel: "Pending Tasks",
        },
        {
            title: "All Tasks",
            description: "Complete overview of all system tasks",
            href: "/admin/tasks?filter=all",
            gradient: "from-indigo-500 to-indigo-700",
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
            ),
            stat: stats?.completedTasks || 0,
            statLabel: "Completed",
        },
        {
            title: "Notifications",
            description: "Send and manage system notifications",
            href: "/admin/notifications",
            gradient: "from-pink-500 to-pink-700",
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
            ),
        },
        ...(userRole === 'SUPER_ADMIN' ? [{
            title: "Label Management",
            description: "Create and organize task labels",
            href: "/admin/labels",
            gradient: "from-teal-500 to-teal-700",
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
            ),
            stat: stats?.labels || 0,
            statLabel: "Labels",
        } as DashboardCard] : []),
        {
            title: "Profile Settings",
            description: "Manage your account and preferences",
            href: "/admin/profile",
            gradient: "from-cyan-500 to-cyan-700",
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
        },
    ];

    if (status === "loading" || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-900 via-gray-800 to-gray-900">
                <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                    <p className="text-gray-300 font-semibold text-lg">Loading Dashboard...</p>
                    <p className="text-gray-500 text-sm mt-2">Preparing your admin panel</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <div className="flex h-screen bg-linear-to-br from-gray-50 via-gray-100 to-gray-50 overflow-hidden">
            {/* Sidebar */}
            <AdminSidebar
                activeSessions={stats?.activeSessions || 0}
                isMobileMenuOpen={isMobileMenuOpen}
                onCloseMobileMenu={handleCloseMobileMenu}
                userRole={userRole}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col lg:ml-64 overflow-hidden">
                {/* Header */}
                <AdminHeader
                    user={session.user}
                    onToggleMobileMenu={handleToggleMobileMenu}
                    title="Overall Dashboard"
                    subtitle="Welcome to your admin control center"
                />

                {/* Dashboard Content */}
                <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 overscroll-contain">
                    <div className="max-w-7xl mx-auto">
                        {/* Welcome Section */}
                        <div className="mb-8">
                            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border-2 border-gray-200">
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div>
                                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 bg-linear-to-r from-blue-600 via-blue-700 to-purple-700 bg-clip-text text-transparent">
                                            Welcome back, {session.user.name || 'Admin'}!
                                        </h1>
                                        <p className="text-gray-600 text-sm sm:text-base">
                                            Here&apos;s what&apos;s happening with your system today
                                        </p>
                                    </div>
                                    <div className="hidden sm:block">
                                        <div className="bg-linear-to-r from-blue-600 via-blue-700 to-purple-700 rounded-xl px-6 py-4 text-white shadow-lg">
                                            <div className="text-3xl font-bold">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                                            <div className="text-sm text-blue-100 mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-xs font-semibold uppercase">Users</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.totalUsers || 0}</p>
                                    </div>
                                    <div className="bg-blue-100 p-2 rounded-lg">
                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-xs font-semibold uppercase">Sessions</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.activeSessions || 0}</p>
                                    </div>
                                    <div className="bg-green-100 p-2 rounded-lg">
                                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-xs font-semibold uppercase">Tasks</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.totalTasks || 0}</p>
                                    </div>
                                    <div className="bg-purple-100 p-2 rounded-lg">
                                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-xs font-semibold uppercase">Logins</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.recentLogins || 0}</p>
                                    </div>
                                    <div className="bg-orange-100 p-2 rounded-lg">
                                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Cards - 2 Column Grid */}
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                                Quick Navigation
                            </h2>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                                {dashboardCards.map((card, index) => (
                                    <Link
                                        key={index}
                                        href={card.href}
                                        className="group block"
                                    >
                                        <Card className="h-full hover:shadow-2xl transition-all duration-300 border-2 border-gray-200 hover:border-blue-400 bg-white overflow-hidden transform hover:-translate-y-1">
                                            <div className={`h-2 bg-linear-to-r ${card.gradient}`}></div>
                                            <CardHeader className="pb-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                                                            {card.title}
                                                            {card.badge && (
                                                                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                                                    {card.badge}
                                                                </span>
                                                            )}
                                                        </CardTitle>
                                                        <CardDescription className="text-sm text-gray-600 mt-1">
                                                            {card.description}
                                                        </CardDescription>
                                                    </div>
                                                    <div className={`p-3 rounded-xl bg-linear-to-br ${card.gradient} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                                        {card.icon}
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex items-center justify-between">
                                                    {card.stat !== undefined ? (
                                                        <div className="flex items-baseline gap-2">
                                                            <span className="text-3xl font-bold text-gray-900">{card.stat}</span>
                                                            <span className="text-sm text-gray-600">{card.statLabel}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-gray-500">Click to access</div>
                                                    )}
                                                    <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Footer Note */}
                        <div className="mt-8 text-center text-sm text-gray-500">
                            <p>Click any card above to navigate to that section</p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
