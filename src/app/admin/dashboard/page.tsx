"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import AuditManagement from "@/components/admin/AuditManagement";
import { useSessionActivity } from "@/hooks/useSessionActivity";

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
}

export default function AdminDashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const tabParam = searchParams?.get("tab");
    const [activeTab, setActiveTab] = useState<"audit" | "sessions">("audit");
    const [stats, setStats] = useState<Stats | null>(null);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Track session activity (excludes admin@keepplayengine.com)
    useSessionActivity();

    const handleToggleMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    }, [isMobileMenuOpen]);

    const handleCloseMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(false);
    }, []);

    // Update active tab based on URL parameter
    useEffect(() => {
        if (tabParam === "sessions") {
            setActiveTab("sessions");
        } else {
            setActiveTab("audit");
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

    // Auto-refresh sessions every 30 seconds when on sessions tab
    useEffect(() => {
        if (activeTab !== 'sessions' || !session) return;

        const interval = setInterval(() => {
            fetchDashboardData();
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [activeTab, session]);

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
            <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-white via-gray-50 to-gray-100">
                <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                    <p className="text-gray-700 font-semibold text-lg">Loading...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <AdminSidebar
                activeSessions={sessions.length}
                isMobileMenuOpen={isMobileMenuOpen}
                onCloseMobileMenu={handleCloseMobileMenu}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                userRole={(session.user as any)?.role}
            />

            <div className="flex-1 flex flex-col lg:ml-64 overflow-hidden">
                <AdminHeader
                    user={session.user}
                    onToggleMobileMenu={handleToggleMobileMenu}
                    title={activeTab === "audit" ? "Audit Logs" : "Active Sessions"}
                    subtitle={activeTab === "audit" ? "Monitor system activity and security events" : "Manage active user sessions"}
                />

                <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 lg:px-8 py-6 lg:py-8 overscroll-contain">
                    {activeTab === "audit" && (
                        <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
                            {/* Audit Management Component - SUPER_ADMIN Only */}
                            <AuditManagement userRole={(session.user as any)?.role} />

                            {/* Mobile-First Responsive Audit Logs */}
                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                {activityLogs.length === 0 ? (
                                    <div className="px-4 py-12 text-center text-gray-500">
                                        <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className="text-sm sm:text-base">No activity logs found</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Mobile Card View (default, mobile-first) */}
                                        <div className="block lg:hidden divide-y divide-gray-100">
                                            {activityLogs.map((log) => (
                                                <div key={log.id} className="p-4 w-full overflow-hidden hover:bg-gray-50 active:bg-gray-100 transition-colors">
                                                    {/* Header: User & Action */}
                                                    <div className="flex items-start justify-between gap-3 mb-3 min-w-0">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                    </svg>
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                                                        {log.user?.full_name || log.user?.email || 'Unknown'}
                                                                    </p>
                                                                    {log.user?.email && log.user?.full_name && (
                                                                        <p className="text-xs text-gray-500 truncate">{log.user.email}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full flex-shrink-0 max-w-[96px] truncate ${getActionBadgeColor(log.action)}`}>
                                                            {log.action}
                                                        </span>
                                                    </div>

                                                    {/* Resource Info */}
                                                    <div className="mb-3 pl-4 sm:pl-10 min-w-0 overflow-hidden">
                                                        <div className="flex items-start gap-2">
                                                            <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                                            </svg>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-gray-900">{log.resource_type}</p>
                                                                {log.description && (
                                                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 break-words">{log.description}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Footer: Time & IP (stack vertically on small screens) */}
                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 text-xs text-gray-500 pl-4 sm:pl-10 pt-2 border-t border-gray-100 min-w-0 overflow-hidden">
                                                        <div className="flex items-center gap-1.5 min-w-0 w-full">
                                                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <span className="truncate">{formatDate(log.created_at)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 mt-1 sm:mt-0 min-w-0 w-full sm:w-auto">
                                                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                                            </svg>
                                                            <span className="font-mono text-xs truncate max-w-full sm:max-w-[140px]">{formatIP(log.ip_address)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Desktop Table View */}
                                        <div className="hidden lg:block overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Timestamp</th>
                                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">User</th>
                                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Action</th>
                                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Resource</th>
                                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">IP Address</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {activityLogs.map((log) => (
                                                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                {formatDate(log.created_at)}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {log.user?.full_name || log.user?.email || 'Unknown'}
                                                                </div>
                                                                {log.user?.email && log.user?.full_name && (
                                                                    <div className="text-xs text-gray-500">{log.user.email}</div>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${getActionBadgeColor(log.action)}`}>
                                                                    {log.action}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                                <div className="font-medium">{log.resource_type}</div>
                                                                {log.description && (
                                                                    <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">{log.description}</div>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                                                                {formatIP(log.ip_address)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === "sessions" && (
                        <div className="space-y-6 max-w-7xl mx-auto">
                            {/* Session Stats Banner */}
                            <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg p-6 text-white">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold">{sessions.length} Active Session{sessions.length !== 1 ? 's' : ''}</h2>
                                        <p className="text-blue-100 mt-1">Tracking Khader & Amro activity (excluding dev account)</p>
                                    </div>
                                    <div className="text-right">
                                        <button
                                            onClick={fetchDashboardData}
                                            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            Refresh
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4">
                                {sessions.length === 0 ? (
                                    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                                        <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                        <p className="text-gray-500 font-medium">No active sessions</p>
                                        <p className="text-gray-400 text-sm mt-2">Khader and Amro sessions will appear here when they log in</p>
                                    </div>
                                ) : (
                                    sessions.map((sess) => (
                                        <div key={sess.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-start space-x-4 flex-1">
                                                    {/* User Avatar */}
                                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
                                                        <span className="text-white text-xl font-bold">
                                                            {sess.user?.full_name?.charAt(0).toUpperCase() || sess.user?.email?.charAt(0).toUpperCase() || '?'}
                                                        </span>
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        {/* User Info */}
                                                        <div className="mb-3">
                                                            <p className="font-bold text-gray-900 text-lg">{sess.user?.full_name || 'Unknown User'}</p>
                                                            <p className="text-sm text-gray-600">{sess.user?.email || 'No email'}</p>
                                                        </div>

                                                        {/* Session Details */}
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            {/* IP Address */}
                                                            <div className="flex items-center text-sm">
                                                                <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                                                </svg>
                                                                <span className="text-gray-700 font-mono">{formatIP(sess.ip_address)}</span>
                                                            </div>

                                                            {/* Last Activity */}
                                                            <div className="flex items-center text-sm">
                                                                <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                <span className="text-gray-700">{formatDate(sess.last_activity_at || sess.created_at)}</span>
                                                            </div>

                                                            {/* Session Start */}
                                                            <div className="flex items-center text-sm">
                                                                <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                                <span className="text-gray-700">Started: {formatDate(sess.created_at)}</span>
                                                            </div>

                                                            {/* Expires */}
                                                            <div className="flex items-center text-sm">
                                                                <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                <span className="text-gray-700">Expires: {formatDate(sess.expires_at)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Revoke Button */}
                                                <div className="shrink-0">
                                                    <button
                                                        onClick={() => handleRevokeSession(sess.id)}
                                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold text-white transition-colors shadow-sm hover:shadow-md"
                                                        title="Revoke this session"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
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
