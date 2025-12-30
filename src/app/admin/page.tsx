"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ActivityLog {
    id: string;
    admin_user_id: string;
    action: string;
    resource_type: string;
    resource_id: string | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
    user?: {
        uuid: string;
        email: string;
        username: string;
    };
}

interface Session {
    id: string;
    admin_user_id: string;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
    expires_at: string;
    user?: {
        uuid: string;
        email: string;
        username: string;
    };
}

interface Stats {
    totalUsers: number;
    activeSessions: number;
    recentLogins: number;
    failedAttempts: number;
    biometricDevices: number;
    loginTrend: number;
}

export default function AdminPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"dashboard" | "audit" | "sessions">("dashboard");
    const [stats, setStats] = useState<Stats | null>(null);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/admin/login");
        }
    }, [status, router]);

    useEffect(() => {
        if (session) {
            fetchDashboardData();
        }
    }, [session]);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            const [statsRes, logsRes, sessionsRes] = await Promise.all([
                fetch("/api/admin/stats"),
                fetch("/api/admin/activity-logs?limit=50"),
                fetch("/api/admin/sessions"),
            ]);

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }

            if (logsRes.ok) {
                const logsData = await logsRes.json();
                setActivityLogs(logsData.logs);
            }

            if (sessionsRes.ok) {
                const sessionsData = await sessionsRes.json();
                setSessions(sessionsData.sessions);
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRevokeSession = async (sessionId: string) => {
        try {
            const res = await fetch(`/api/admin/sessions?id=${sessionId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setSessions(sessions.filter(s => s.id !== sessionId));
            }
        } catch (error) {
            console.error("Error revoking session:", error);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const getActionBadgeColor = (action: string) => {
        if (action === "LOGIN" || action === "biometric_login") return "bg-green-100 text-green-800";
        if (action === "LOGOUT") return "bg-gray-100 text-gray-800";
        if (action.includes("failed") || action.includes("FAILED")) return "bg-red-100 text-red-800";
        return "bg-blue-100 text-blue-800";
    };

    if (status === "loading" || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-blue-50">
            {/* Enhanced Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-md backdrop-blur-sm bg-white/95">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-4">
                            <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                                <svg
                                    className="w-6 h-6 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-gray-900">KeepPlay Engine</h1>
                                <span className="text-xs text-blue-600 font-semibold">Admin Panel</span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-green-50 to-green-100 px-4 py-2 rounded-lg border border-green-200">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-xs font-medium text-green-700">Secure</span>
                            </div>
                            <div className="text-sm text-right hidden md:block">
                                <p className="font-semibold text-gray-900">{session.user?.name || session.user?.email}</p>
                                <p className="text-xs text-blue-600 font-medium">
                                    {session.user?.role}
                                </p>
                            </div>
                            <button
                                onClick={() => signOut({ callbackUrl: "/" })}
                                className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg text-sm font-semibold text-white transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Tab Navigation */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex space-x-8" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab("dashboard")}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-all ${activeTab === "dashboard"
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                        >
                            <div className="flex items-center space-x-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                <span>Dashboard</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab("audit")}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-all ${activeTab === "audit"
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                        >
                            <div className="flex items-center space-x-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <span>Audit Logs</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab("sessions")}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-all ${activeTab === "sessions"
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                        >
                            <div className="flex items-center space-x-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                <span>Active Sessions</span>
                                {sessions.length > 0 && (
                                    <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-blue-600 text-white rounded-full">
                                        {sessions.length}
                                    </span>
                                )}
                            </div>
                        </button>
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Dashboard Tab */}
                {activeTab === "dashboard" && (
                    <div className="space-y-8">
                        {/* Welcome Section */}
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 shadow-lg text-white">
                            <h2 className="text-3xl font-bold mb-2">
                                Welcome back, {session.user?.name?.split(' ')[0] || 'Admin'}! 👋
                            </h2>
                            <p className="text-blue-100 text-lg">
                                Manage your KeepPlay Engine administrative tasks with enterprise-grade security
                            </p>
                        </div>

                        {/* Statistics Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all transform hover:-translate-y-1">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Total Users</p>
                                        <p className="text-4xl font-bold text-gray-900 mt-2">{stats?.totalUsers || 0}</p>
                                        <p className="text-xs text-gray-500 mt-2">Registered accounts</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl shadow-lg">
                                        <svg
                                            className="w-8 h-8 text-white"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all transform hover:-translate-y-1">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Active Sessions</p>
                                        <p className="text-4xl font-bold text-gray-900 mt-2">{stats?.activeSessions || 0}</p>
                                        <p className="text-xs text-gray-500 mt-2">Currently active</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-xl shadow-lg">
                                        <svg
                                            className="w-8 h-8 text-white"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all transform hover:-translate-y-1">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Security Status</p>
                                        <p className="text-4xl font-bold text-green-600 mt-2">High</p>
                                        <p className="text-xs text-gray-500 mt-2">All systems secure</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-xl shadow-lg">
                                        <svg
                                            className="w-8 h-8 text-white"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all transform hover:-translate-y-1">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Logins (24h)</p>
                                        <p className="text-4xl font-bold text-gray-900 mt-2">{stats?.recentLogins || 0}</p>
                                        <p className="text-xs text-green-600 font-medium mt-2">↑ Successful</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-4 rounded-xl shadow-lg">
                                        <svg
                                            className="w-8 h-8 text-white"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all transform hover:-translate-y-1">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Failed Attempts</p>
                                        <p className="text-4xl font-bold text-gray-900 mt-2">{stats?.failedAttempts || 0}</p>
                                        <p className="text-xs text-red-600 font-medium mt-2">↓ Last 24 hours</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-red-500 to-red-600 p-4 rounded-xl shadow-lg">
                                        <svg
                                            className="w-8 h-8 text-white"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all transform hover:-translate-y-1">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Biometric Devices</p>
                                        <p className="text-4xl font-bold text-gray-900 mt-2">{stats?.biometricDevices || 0}</p>
                                        <p className="text-xs text-gray-500 mt-2">Registered devices</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-4 rounded-xl shadow-lg">
                                        <svg
                                            className="w-8 h-8 text-white"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Security Features Grid */}
                        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900">Security Features</h3>
                                <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                                    4 Layers Active
                                </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="flex items-start space-x-4 p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
                                    <div className="flex-shrink-0 w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center shadow-md">
                                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">SSL Secured</p>
                                        <p className="text-xs text-gray-600 mt-1">Bank-grade encryption</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                                    <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
                                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">Rate Limiting</p>
                                        <p className="text-xs text-gray-600 mt-1">5 attempts per 15 min</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-4 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
                                    <div className="flex-shrink-0 w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center shadow-md">
                                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">Session Management</p>
                                        <p className="text-xs text-gray-600 mt-1">2-hour auto-logout</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-4 p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200">
                                    <div className="flex-shrink-0 w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">Audit Logging</p>
                                        <p className="text-xs text-gray-600 mt-1">All actions tracked</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-4 p-4 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
                                    <div className="flex-shrink-0 w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center shadow-md">
                                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">Password Hashing</p>
                                        <p className="text-xs text-gray-600 mt-1">bcrypt (12 rounds)</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-4 p-4 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200">
                                    <div className="flex-shrink-0 w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center shadow-md">
                                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">Role-Based Access</p>
                                        <p className="text-xs text-gray-600 mt-1">Granular permissions</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Enterprise Security Notice */}
                        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-2xl p-8 shadow-2xl border-2 border-blue-300">
                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0 w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-white mb-3 flex items-center">
                                        🏦 Enterprise-Grade Security
                                    </h3>
                                    <p className="text-blue-100 text-base leading-relaxed">
                                        This administrative interface is protected with <span className="font-bold text-white">4 layers of bank-level security</span>.
                                        All communications are encrypted with TLS 1.3, access is strictly controlled through Cloudflare Access + NextAuth,
                                        biometric authentication is enforced, and every action is logged for audit purposes with full compliance tracking.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Audit Logs Tab */}
                {activeTab === "audit" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Audit Logs</h2>
                                <p className="text-gray-600 mt-1">Complete activity tracking and security monitoring</p>
                            </div>
                            <button
                                onClick={fetchDashboardData}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold text-white transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span>Refresh</span>
                            </button>
                        </div>

                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                        <tr>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Timestamp
                                            </th>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                User
                                            </th>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Action
                                            </th>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Resource
                                            </th>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                IP Address
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {activityLogs.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        <p className="text-gray-500 text-sm">No activity logs found</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            activityLogs.map((log) => (
                                                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {formatDate(log.created_at)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {log.user?.username || log.user?.email || 'Unknown'}
                                                        </div>
                                                        {log.user?.email && (
                                                            <div className="text-xs text-gray-500">{log.user.email}</div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${getActionBadgeColor(log.action)}`}>
                                                            {log.action}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        <div className="font-medium">{log.resource_type}</div>
                                                        {log.resource_id && (
                                                            <div className="text-xs text-gray-500 font-mono truncate max-w-xs">
                                                                {log.resource_id}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                        {log.ip_address || 'N/A'}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Active Sessions Tab */}
                {activeTab === "sessions" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Active Sessions</h2>
                                <p className="text-gray-600 mt-1">Monitor and manage active user sessions</p>
                            </div>
                            <button
                                onClick={fetchDashboardData}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold text-white transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span>Refresh</span>
                            </button>
                        </div>

                        <div className="grid gap-4">
                            {sessions.length === 0 ? (
                                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12">
                                    <div className="flex flex-col items-center justify-center">
                                        <svg className="w-20 h-20 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        <p className="text-gray-500 text-lg font-medium">No active sessions</p>
                                    </div>
                                </div>
                            ) : (
                                sessions.map((sess) => (
                                    <div key={sess.id} className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{sess.user?.username || sess.user?.email || 'Unknown User'}</p>
                                                    <p className="text-sm text-gray-500">{sess.user?.email}</p>
                                                    <p className="text-xs text-gray-400 mt-1 font-mono">{sess.ip_address || 'Unknown IP'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500 mb-2">Started: {formatDate(sess.created_at)}</p>
                                                <p className="text-xs text-gray-500 mb-3">Expires: {formatDate(sess.expires_at)}</p>
                                                <button
                                                    onClick={() => handleRevokeSession(sess.id)}
                                                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-semibold text-white transition-all shadow-sm hover:shadow-md"
                                                >
                                                    Revoke Session
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
