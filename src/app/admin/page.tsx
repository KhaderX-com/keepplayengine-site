"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

interface ActivityLog {
    id: string;
    admin_user_id: string;
    action: string;
    resource_type: string;
    resource_id: string | null;
    description: string | null;
    ip_address: string | null;
    user_agent: string | null;
    severity: string;
    created_at: string;
    user?: {
        id: string;
        email: string;
        full_name: string | null;
    };
}

interface Session {
    id: string;
    admin_user_id: string;
    ip_address: string | null;
    user_agent: string | null;
    device_info: Record<string, unknown> | null;
    created_at: string;
    expires_at: string;
    last_activity_at: string;
    user?: {
        id: string;
        email: string;
        full_name: string | null;
    };
}

interface Stats {
    totalUsers: number;
    activeSessions: number;
    recentLogins: number;
    failedAttempts: number;
    biometricDevices: number;
    loginTrend: number;
    biometricLogins24h: number;
    passwordLogins24h: number;
    uniqueIPs24h: number;
}

export default function AdminPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const tabParam = searchParams?.get("tab");
    const [activeTab, setActiveTab] = useState<"dashboard" | "audit" | "sessions">("dashboard");
    const [stats, setStats] = useState<Stats | null>(null);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleToggleMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    }, [isMobileMenuOpen]);

    const handleCloseMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(false);
    }, []);

    // Update active tab based on URL parameter
    useEffect(() => {
        if (tabParam === "audit") {
            setActiveTab("audit");
        } else if (tabParam === "sessions") {
            setActiveTab("sessions");
        } else {
            setActiveTab("dashboard");
        }
    }, [tabParam]);

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
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const formatIP = (ip: string | null): string => {
        if (!ip || ip === 'unknown') return 'N/A';
        if (ip === '::1' || ip === '127.0.0.1') return `${ip} (Local)`;
        return ip;
    };

    const getDeviceIcon = (userAgent: string | null) => {
        if (!userAgent) return 'desktop';
        if (userAgent.includes('Mobile') || userAgent.includes('Android')) return 'mobile';
        if (userAgent.includes('Tablet') || userAgent.includes('iPad')) return 'tablet';
        return 'desktop';
    };

    const getActionBadgeColor = (action: string) => {
        if (action === "LOGIN" || action === "biometric_login") return "bg-green-100 text-green-800";
        if (action === "LOGOUT") return "bg-gray-100 text-gray-800";
        if (action.includes("failed") || action.includes("FAILED")) return "bg-red-100 text-red-800";
        return "bg-blue-100 text-blue-800";
    };

    if (status === "loading" || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar - Mobile Responsive */}
            <AdminSidebar
                activeSessions={sessions.length}
                isMobileMenuOpen={isMobileMenuOpen}
                onCloseMobileMenu={handleCloseMobileMenu}
            />

            {/* Main Content Area - Mobile First */}
            <div className="flex-1 flex flex-col lg:ml-64 overflow-hidden">
                {/* Header - With Mobile Menu Toggle */}
                <AdminHeader
                    user={session.user}
                    onToggleMobileMenu={handleToggleMobileMenu}
                    title={activeTab === "dashboard" ? "Dashboard" : activeTab === "audit" ? "Audit Logs" : "Active Sessions"}
                    subtitle={activeTab === "dashboard" ? "Welcome back to your admin panel" : activeTab === "audit" ? "Monitor system activity and security events" : "Manage active user sessions"}
                />

                {/* Page Content - Responsive Padding */}
                <main className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 overscroll-contain">
                    {/* Dashboard Tab - Mobile Optimized */}
                    {activeTab === "dashboard" && (
                        <div className="space-y-4 sm:space-y-6 lg:space-y-8 max-w-7xl mx-auto">
                            {/* Statistics Cards - Responsive Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                                <div className="bg-white rounded-lg p-4 sm:p-5 lg:p-6 border border-gray-200 hover:border-gray-300 transition-all touch-manipulation active:scale-[0.99]">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <p className="text-gray-600 text-xs sm:text-sm font-semibold uppercase tracking-wide">Total Users</p>
                                            <p className="text-3xl sm:text-4xl font-bold text-gray-900 mt-1 sm:mt-2">{stats?.totalUsers || 0}</p>
                                            <p className="text-xs text-gray-500 mt-1 sm:mt-2">Registered accounts</p>
                                        </div>
                                        <div className="bg-blue-600 p-3 sm:p-4 rounded-lg shrink-0">
                                            <svg className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg p-6 border border-gray-200 hover:border-gray-300 transition-all">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Active Sessions</p>
                                            <p className="text-4xl font-bold text-gray-900 mt-2">{stats?.activeSessions || 0}</p>
                                            <p className="text-xs text-gray-500 mt-2">Currently active</p>
                                        </div>
                                        <div className="bg-green-600 p-4 rounded-lg">
                                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg p-6 border border-gray-200 hover:border-gray-300 transition-all">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Security Status</p>
                                            <p className="text-4xl font-bold text-green-600 mt-2">High</p>
                                            <p className="text-xs text-gray-500 mt-2">All systems secure</p>
                                        </div>
                                        <div className="bg-purple-600 p-4 rounded-lg">
                                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg p-6 border border-gray-200 hover:border-gray-300 transition-all">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Logins (24h)</p>
                                            <p className="text-4xl font-bold text-gray-900 mt-2">{stats?.recentLogins || 0}</p>
                                            <p className="text-xs text-green-600 font-medium mt-2">↑ Successful</p>
                                        </div>
                                        <div className="bg-indigo-600 p-4 rounded-lg">
                                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg p-6 border border-gray-200 hover:border-gray-300 transition-all">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Failed Attempts</p>
                                            <p className="text-4xl font-bold text-gray-900 mt-2">{stats?.failedAttempts || 0}</p>
                                            <p className="text-xs text-red-600 font-medium mt-2">↓ Last 24 hours</p>
                                        </div>
                                        <div className="bg-red-600 p-4 rounded-lg">
                                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg p-6 border border-gray-200 hover:border-gray-300 transition-all">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Biometric Devices</p>
                                            <p className="text-4xl font-bold text-gray-900 mt-2">{stats?.biometricDevices || 0}</p>
                                            <p className="text-xs text-gray-500 mt-2">Registered devices</p>
                                        </div>
                                        <div className="bg-teal-600 p-4 rounded-lg">
                                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Security Features Grid - Mobile Responsive */}
                            <div className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 border border-gray-200">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-2">
                                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">Security Features</h3>
                                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                                        6 Layers Active
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                                    <div className="flex items-start space-x-3 p-3 sm:p-4 rounded-lg bg-green-50 border border-green-200 touch-manipulation hover:shadow-md transition-shadow">
                                        <div className="shrink-0 w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">SSL Secured</p>
                                            <p className="text-xs text-gray-600 mt-1">Bank-grade encryption</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
                                        <div className="shrink-0 w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">Rate Limiting</p>
                                            <p className="text-xs text-gray-600 mt-1">5 attempts per 15 min</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-4 p-4 rounded-lg bg-purple-50 border border-purple-200">
                                        <div className="shrink-0 w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">Session Management</p>
                                            <p className="text-xs text-gray-600 mt-1">2-hour auto-logout</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-4 p-4 rounded-lg bg-indigo-50 border border-indigo-200">
                                        <div className="shrink-0 w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">Audit Logging</p>
                                            <p className="text-xs text-gray-600 mt-1">All actions tracked</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-4 p-4 rounded-lg bg-orange-50 border border-orange-200">
                                        <div className="shrink-0 w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">Password Hashing</p>
                                            <p className="text-xs text-gray-600 mt-1">bcrypt (12 rounds)</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-4 p-4 rounded-lg bg-teal-50 border border-teal-200">
                                        <div className="shrink-0 w-12 h-12 bg-teal-600 rounded-lg flex items-center justify-center">
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
                        </div>
                    )}

                    {/* Audit Logs Tab - Mobile Optimized */}
                    {activeTab === "audit" && (
                        <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
                            {/* header removed - title shown in main navbar */}

                            {/* Mobile: Card View, Desktop: Table View */}
                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                {/* Desktop Table View */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
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
                                                                {log.user?.full_name || log.user?.email || 'Unknown'}
                                                            </div>
                                                            {log.user?.email && log.user?.full_name && (
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
                                                            {log.description && (
                                                                <div className="text-xs text-gray-400 mt-1 max-w-xs truncate">
                                                                    {log.description}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                                                            <span className={`${log.ip_address === '::1' || log.ip_address === '127.0.0.1' ? 'text-yellow-600' : 'text-gray-500'}`}>
                                                                {formatIP(log.ip_address)}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Card View */}
                                <div className="md:hidden divide-y divide-gray-200">
                                    {activityLogs.length === 0 ? (
                                        <div className="p-8 text-center">
                                            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <p className="text-gray-500 text-sm">No activity logs found</p>
                                        </div>
                                    ) : (
                                        activityLogs.map((log) => (
                                            <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors touch-manipulation">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {log.user?.full_name || log.user?.email || 'Unknown'}
                                                        </div>
                                                        {log.user?.email && log.user?.full_name && (
                                                            <div className="text-xs text-gray-500">{log.user.email}</div>
                                                        )}
                                                    </div>
                                                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${getActionBadgeColor(log.action)}`}>
                                                        {log.action}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-gray-900 mb-1">
                                                    <span className="font-medium">{log.resource_type}</span>
                                                    {log.description && (
                                                        <p className="text-xs text-gray-500 mt-1">{log.description}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between text-xs text-gray-500">
                                                    <span className="font-mono">{formatIP(log.ip_address)}</span>
                                                    <span>{new Date(log.created_at).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Active Sessions Tab - Mobile Optimized */}
                    {activeTab === "sessions" && (
                        <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
                            {/* header removed - title shown in main navbar */}

                            <div className="grid gap-3 sm:gap-4">
                                {sessions.length === 0 ? (
                                    <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12">
                                        <div className="flex flex-col items-center justify-center">
                                            <svg className="w-16 h-16 sm:w-20 sm:h-20 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                            <p className="text-gray-500 text-base sm:text-lg font-medium">No active sessions</p>
                                        </div>
                                    </div>
                                ) : (
                                    sessions.map((sess) => (
                                        <div key={sess.id} className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 lg:p-6 hover:border-gray-300 transition-all touch-manipulation">
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1">
                                                    <div className={`w-10 h-10 sm:w-12 sm:h-12 ${getDeviceIcon(sess.user_agent) === 'mobile' ? 'bg-green-600' : 'bg-blue-600'} rounded-lg flex items-center justify-center shrink-0`}>
                                                        {getDeviceIcon(sess.user_agent) === 'mobile' ? (
                                                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-sm sm:text-base text-gray-900 truncate">{sess.user?.full_name || sess.user?.email || 'Unknown User'}</p>
                                                        {sess.user?.full_name && sess.user?.email && (
                                                            <p className="text-xs sm:text-sm text-gray-500 truncate">{sess.user.email}</p>
                                                        )}
                                                        <p className={`text-xs mt-1 font-mono ${sess.ip_address === '::1' || sess.ip_address === '127.0.0.1' ? 'text-yellow-600' : 'text-gray-400'}`}>
                                                            {formatIP(sess.ip_address)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="w-full sm:w-auto sm:text-right">
                                                    <p className="text-xs text-gray-500 mb-1">Started: {formatDate(sess.created_at)}</p>
                                                    <p className="text-xs text-gray-500 mb-1">Last: {formatDate(sess.last_activity_at || sess.created_at)}</p>
                                                    <p className="text-xs text-gray-500 mb-3">Expires: {formatDate(sess.expires_at)}</p>
                                                    <button
                                                        onClick={() => handleRevokeSession(sess.id)}
                                                        className="w-full sm:w-auto px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-semibold text-white transition-all touch-manipulation active:scale-95"
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
        </div>
    );
}
