"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
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
        avatar_url?: string | null;
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
        avatar_url?: string | null;
    };
}

interface DashboardClientProps {
    initialLogs: ActivityLog[];
    initialSessions: Session[];
    userRole?: string;
}

export default function DashboardClient({
    initialLogs,
    initialSessions,
    userRole,
}: DashboardClientProps) {
    const searchParams = useSearchParams();
    const tabParam = searchParams?.get("tab");
    const [activeTab, setActiveTab] = useState<"audit" | "sessions">("audit");
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(initialLogs);
    const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
    const [sessions, setSessions] = useState<Session[]>(initialSessions);

    // Update active tab based on URL parameter
    useEffect(() => {
        if (tabParam === "sessions") {
            setActiveTab("sessions");
        } else {
            setActiveTab("audit");
        }
    }, [tabParam]);

    const fetchData = useCallback(async () => {
        try {
            const [logsRes, sessionsRes] = await Promise.all([
                fetch("/api/admin/activity-logs?limit=50"),
                fetch("/api/admin/sessions"),
            ]);

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
        }
    }, []);

    // Auto-refresh sessions every 30 seconds when on sessions tab
    useEffect(() => {
        if (activeTab !== "sessions") return;

        const interval = setInterval(() => {
            fetchData();
        }, 30000);

        return () => clearInterval(interval);
    }, [activeTab, fetchData]);

    const handleRevokeSession = async (sessionId: string) => {
        try {
            const res = await fetch(`/api/admin/sessions?id=${sessionId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setSessions(sessions.filter((s) => s.id !== sessionId));
            }
        } catch (error) {
            console.error("Error revoking session:", error);
        } finally {
            setConfirmRevokeId(null);
        }
    };

    const confirmSession = sessions.find((s) => s.id === confirmRevokeId);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const formatIP = (ip: string | null): string => {
        if (!ip || ip === "unknown") return "N/A";
        if (ip === "::1" || ip === "127.0.0.1") return `${ip} (Local)`;
        return ip;
    };

    const getActionBadgeColor = (action: string) => {
        if (action === "LOGIN" || action === "biometric_login")
            return "bg-green-100 text-green-800";
        if (action === "LOGOUT") return "bg-gray-100 text-gray-800";
        if (action.includes("failed") || action.includes("FAILED"))
            return "bg-red-100 text-red-800";
        return "bg-blue-100 text-blue-800";
    };

    return (
        <>
            {/* Revoke Confirmation Modal */}
            {confirmRevokeId && confirmSession && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={() => setConfirmRevokeId(null)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Icon */}
                        <div className="flex items-center justify-center w-14 h-14 bg-red-100 rounded-full mx-auto">
                            <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            </svg>
                        </div>

                        {/* Text */}
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-gray-900">Revoke Session?</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                This will immediately log out
                            </p>
                            <p className="text-sm font-semibold text-gray-800 mt-0.5">
                                {confirmSession.user?.full_name || confirmSession.user?.email || "this user"}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">This action cannot be undone.</p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmRevokeId(null)}
                                className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleRevokeSession(confirmRevokeId)}
                                className="flex-1 px-4 py-2.5 rounded-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-sm font-semibold text-white transition-colors touch-manipulation shadow-sm"
                            >
                                Yes, Revoke
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "audit" && (
                <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
                    {/* Audit Management Component - SUPER_ADMIN Only */}
                    <AuditManagement userRole={userRole ?? "ADMIN"} />

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
                                {/* Mobile Card View */}
                                <div className="block lg:hidden divide-y divide-gray-100">
                                    {activityLogs.map((log) => (
                                        <div key={log.id} className="p-4 w-full overflow-hidden hover:bg-gray-50 active:bg-gray-100 transition-colors">
                                            <div className="flex items-start justify-between gap-3 mb-3 min-w-0">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                                                            {log.user?.avatar_url ? (
                                                                <Image
                                                                    src={log.user.avatar_url}
                                                                    alt={log.user.full_name || log.user.email}
                                                                    width={32}
                                                                    height={32}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <span className="text-xs font-bold text-gray-600">
                                                                    {(log.user?.full_name || log.user?.email || "?").charAt(0).toUpperCase()}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-gray-900 truncate">
                                                                {log.user?.full_name || log.user?.email || "Unknown"}
                                                            </p>
                                                            {log.user?.email && log.user?.full_name && (
                                                                <p className="text-xs text-gray-500 truncate">{log.user.email}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className={`px-2.5 py-1 text-xs font-bold rounded-full shrink-0 ${getActionBadgeColor(log.action)}`}>
                                                    {log.action}
                                                </span>
                                            </div>

                                            <div className="mb-3 pl-4 sm:pl-10 min-w-0 overflow-hidden">
                                                <div className="flex items-start gap-2">
                                                    <svg className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                                    </svg>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900">{log.resource_type}</p>
                                                        {log.description && (
                                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 wrap-break-word">{log.description}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 text-xs text-gray-500 pl-4 sm:pl-10 pt-2 border-t border-gray-100 min-w-0 overflow-hidden">
                                                <div className="flex items-center gap-1.5 min-w-0 w-full">
                                                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span className="truncate">{formatDate(log.created_at)}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-1 sm:mt-0 min-w-0 w-full sm:w-auto">
                                                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                                    </svg>
                                                    <span className="font-mono text-xs truncate max-w-full sm:max-w-35">{formatIP(log.ip_address)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop Table View — no horizontal scroll */}
                                <div className="hidden lg:block">
                                    <table className="w-full divide-y divide-gray-200 table-fixed">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="w-32.5 px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Timestamp</th>
                                                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">User</th>
                                                <th className="w-44 px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Action</th>
                                                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Resource</th>
                                                <th className="w-30 px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">IP Address</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {activityLogs.map((log) => {
                                                const d = new Date(log.created_at);
                                                return (
                                                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-4 py-4 text-sm text-gray-900">
                                                            <div>{d.toLocaleDateString()}</div>
                                                            <div className="text-xs text-gray-500">{d.toLocaleTimeString()}</div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                                                                    {log.user?.avatar_url ? (
                                                                        <Image
                                                                            src={log.user.avatar_url}
                                                                            alt={log.user.full_name || log.user.email || ""}
                                                                            width={28}
                                                                            height={28}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <span className="text-[10px] font-bold text-gray-600">
                                                                            {(log.user?.full_name || log.user?.email || "?").charAt(0).toUpperCase()}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="text-sm font-medium text-gray-900 truncate">
                                                                        {log.user?.full_name || log.user?.email || "Unknown"}
                                                                    </div>
                                                                    {log.user?.email && log.user?.full_name && (
                                                                        <div className="text-xs text-gray-500 truncate">{log.user.email}</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full truncate max-w-full ${getActionBadgeColor(log.action)}`}>
                                                                {log.action}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 text-sm text-gray-900">
                                                            <div className="font-medium truncate">{log.resource_type}</div>
                                                            {log.description && (
                                                                <div className="text-xs text-gray-500 mt-1 truncate">{log.description}</div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-4 text-xs font-mono text-gray-500 break-all">
                                                            {formatIP(log.ip_address)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
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
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="min-w-0">
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{sessions.length} Active Session{sessions.length !== 1 ? "s" : ""}</h2>
                                <p className="text-gray-500 mt-1 text-sm">Live session monitoring &middot; auto-refreshes every 30s</p>
                            </div>
                            <div className="shrink-0">
                                <button
                                    onClick={fetchData}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-gray-800 active:bg-gray-700 rounded-full text-sm font-semibold text-white transition-colors w-full sm:w-auto justify-center"
                                >
                                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Refresh
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {sessions.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </div>
                                <p className="text-gray-700 font-semibold">No active sessions</p>
                                <p className="text-gray-400 text-sm mt-2">Sessions will appear here when users log in</p>
                            </div>
                        ) : (
                            sessions.map((sess) => {
                                const lastActive = new Date(sess.last_activity_at || sess.created_at);
                                const started = new Date(sess.created_at);
                                const expires = new Date(sess.expires_at);
                                return (
                                    <div key={sess.id} className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 hover:border-gray-300 hover:shadow-sm transition-all overflow-hidden">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                                                {sess.user?.avatar_url ? (
                                                    <Image
                                                        src={sess.user.avatar_url}
                                                        alt={sess.user.full_name || sess.user.email}
                                                        width={48}
                                                        height={48}
                                                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-11 h-11 sm:w-12 sm:h-12 bg-black rounded-full flex items-center justify-center shrink-0">
                                                        <span className="text-white text-base sm:text-lg font-bold">
                                                            {sess.user?.full_name?.charAt(0).toUpperCase() || sess.user?.email?.charAt(0).toUpperCase() || "?"}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="flex-1 min-w-0 overflow-hidden">
                                                    <div className="mb-3 min-w-0">
                                                        <p className="font-bold text-gray-900 text-sm sm:text-base truncate">{sess.user?.full_name || "Unknown User"}</p>
                                                        <p className="text-xs text-gray-500 truncate">{sess.user?.email || "No email"}</p>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                                                        <div className="min-w-0">
                                                            <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">IP Address</p>
                                                            <p className="text-sm font-mono text-gray-700 break-all">{formatIP(sess.ip_address)}</p>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Last Active</p>
                                                            <p className="text-sm text-gray-700">{lastActive.toLocaleDateString()}</p>
                                                            <p className="text-xs text-gray-500">{lastActive.toLocaleTimeString()}</p>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Started</p>
                                                            <p className="text-sm text-gray-700">{started.toLocaleDateString()}</p>
                                                            <p className="text-xs text-gray-500">{started.toLocaleTimeString()}</p>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Expires</p>
                                                            <p className="text-sm text-gray-700">{expires.toLocaleDateString()}</p>
                                                            <p className="text-xs text-gray-500">{expires.toLocaleTimeString()}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="shrink-0">
                                                <button
                                                    onClick={() => setConfirmRevokeId(sess.id)}
                                                    className="px-3 py-1.5 flex items-center gap-1.5 bg-red-50 hover:bg-red-100 active:bg-red-200 border border-red-200 hover:border-red-400 rounded-full text-red-600 hover:text-red-700 text-xs font-semibold transition-colors touch-manipulation"
                                                    title="Revoke this session"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                    Revoke
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
