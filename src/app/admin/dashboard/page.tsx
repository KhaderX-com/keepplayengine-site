"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import AuditManagement from "@/components/admin/AuditManagement";

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
            <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-900 via-gray-800 to-gray-900">
                <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                    <p className="text-gray-300 font-semibold text-lg">Loading...</p>
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

                <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 overscroll-contain">
                    {activeTab === "audit" && (
                        <div className="space-y-6 max-w-7xl mx-auto">
                            {/* Audit Management Component - SUPER_ADMIN Only */}
                            <AuditManagement userRole={(session.user as any)?.role} />

                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Timestamp</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">User</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Action</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Resource</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">IP Address</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {activityLogs.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">No activity logs found</td>
                                                </tr>
                                            ) : (
                                                activityLogs.map((log) => (
                                                    <tr key={log.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 text-sm text-gray-900">{formatDate(log.created_at)}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm font-medium text-gray-900">{log.user?.full_name || log.user?.email || 'Unknown'}</div>
                                                            {log.user?.email && log.user?.full_name && <div className="text-xs text-gray-500">{log.user.email}</div>}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${getActionBadgeColor(log.action)}`}>{log.action}</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-900">
                                                            <div className="font-medium">{log.resource_type}</div>
                                                            {log.description && <div className="text-xs text-gray-400 mt-1">{log.description}</div>}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-mono text-gray-500">{formatIP(log.ip_address)}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "sessions" && (
                        <div className="space-y-6 max-w-7xl mx-auto">
                            <div className="grid gap-4">
                                {sessions.length === 0 ? (
                                    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">No active sessions</div>
                                ) : (
                                    sessions.map((sess) => (
                                        <div key={sess.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{sess.user?.full_name || sess.user?.email || 'Unknown'}</p>
                                                        <p className="text-xs text-gray-500 font-mono">{formatIP(sess.ip_address)}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-500 mb-2">Last: {formatDate(sess.last_activity_at || sess.created_at)}</p>
                                                    <button
                                                        onClick={() => handleRevokeSession(sess.id)}
                                                        className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-semibold text-white"
                                                    >
                                                        Revoke
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
