"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { SendNotificationModal } from "@/components/notifications";
import { formatDistanceToNow, format } from "date-fns";
import type { Notification, SentNotification, AdminUserBasic } from "@/types/notifications";
import { NOTIFICATION_ICONS, PRIORITY_COLORS } from "@/types/notifications";
import AdminPageShell from "@/components/admin/AdminPageShell";

interface NotificationsClientProps {
    initialNotifications: Notification[];
    initialUnreadCount: number;
    user: {
        id?: string;
        name?: string | null;
        email?: string | null;
        role?: string;
        image?: string | null;
    };
    userRole?: string;
}

export default function NotificationsClient({
    initialNotifications,
    initialUnreadCount,
    user,
    userRole,
}: NotificationsClientProps) {
    const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
    const [loading, setLoading] = useState(false);
    const [selectedTab, setSelectedTab] = useState<"all" | "unread" | "archived" | "sent">("all");
    const [showSendModal, setShowSendModal] = useState(false);
    const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
    const [sentNotifications, setSentNotifications] = useState<SentNotification[]>([]);
    const [sentLoading, setSentLoading] = useState(false);

    // Fetch received notifications when tab changes
    const fetchNotifications = useCallback(async () => {
        if (selectedTab === "sent") return;
        setLoading(true);
        try {
            const params = new URLSearchParams({
                limit: "50",
                unreadOnly: selectedTab === "unread" ? "true" : "false",
                ...(selectedTab === "archived" && { includeArchived: "true" }),
            });

            const response = await fetch(`/api/notifications?${params}`);
            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications);
                setUnreadCount(data.unread_count);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    }, [selectedTab]);

    // Fetch sent notifications
    const fetchSentNotifications = useCallback(async () => {
        if (selectedTab !== "sent") return;
        setSentLoading(true);
        try {
            const response = await fetch("/api/notifications/sent?limit=50");
            if (response.ok) {
                const data = await response.json();
                setSentNotifications(data.notifications);
            }
        } catch (error) {
            console.error("Error fetching sent notifications:", error);
        } finally {
            setSentLoading(false);
        }
    }, [selectedTab]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    useEffect(() => {
        fetchSentNotifications();
    }, [fetchSentNotifications]);

    // Mark as read
    const markAsRead = async (notificationIds?: string[]) => {
        try {
            const response = await fetch("/api/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "mark_read",
                    notificationIds,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setUnreadCount(data.unread_count);
                setNotifications((prev) =>
                    prev.map((n) =>
                        !notificationIds || notificationIds.includes(n.id)
                            ? { ...n, is_read: true, read_at: new Date().toISOString() }
                            : n
                    )
                );
            }
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    // Delete/Archive notification
    const handleDelete = async (id: string, archive = false) => {
        try {
            const response = await fetch(`/api/notifications/${id}?archive=${archive}`, {
                method: "DELETE",
            });

            if (response.ok) {
                setNotifications((prev) => prev.filter((n) => n.id !== id));
                fetchNotifications();
            }
        } catch (error) {
            console.error("Error deleting notification:", error);
        }
    };

    return (
        <AdminPageShell
            user={user}
            title="Notifications"
            subtitle="Manage your notifications and messages"
            userRole={userRole}
        >
            <main className="p-4 sm:p-6 lg:p-8">
                {/* Tabs */}
                <div className="flex items-center gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-full sm:w-fit">
                    {[
                        { id: "all" as const, label: "All" },
                        { id: "unread" as const, label: "Unread", count: unreadCount },
                        { id: "archived" as const, label: "Archived" },
                        { id: "sent" as const, label: "Sent" },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setSelectedTab(tab.id)}
                            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 touch-manipulation ${
                                selectedTab === tab.id
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-600 hover:text-gray-900"
                            }`}
                        >
                            {tab.label}
                            {tab.count !== undefined && tab.count > 0 && (
                                <span className="px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Notifications List */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {selectedTab === "sent" ? (
                        sentLoading ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : sentNotifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </div>
                                <p className="text-lg font-medium text-gray-900">No sent notifications</p>
                                <p className="text-sm text-gray-500 mt-1 max-w-sm">Notifications you send to other admins will appear here.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {sentNotifications.map((notification) => (
                                    <SentNotificationRow
                                        key={notification.id}
                                        notification={notification}
                                    />
                                ))}
                            </div>
                        )
                    ) : loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </div>
                            <p className="text-lg font-medium text-gray-900">No notifications</p>
                            <p className="text-sm text-gray-500 mt-1 max-w-sm">
                                {selectedTab === "unread"
                                    ? "You're all caught up! No unread notifications."
                                    : selectedTab === "archived"
                                        ? "No archived notifications yet."
                                        : "When you receive notifications, they'll appear here."}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {notifications.map((notification) => (
                                <NotificationRow
                                    key={notification.id}
                                    notification={notification}
                                    onMarkRead={() => markAsRead([notification.id])}
                                    onDelete={() => handleDelete(notification.id)}
                                    onArchive={() => handleDelete(notification.id, true)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <SendNotificationModal
                isOpen={showSendModal}
                onClose={() => setShowSendModal(false)}
                onSuccess={() => {
                    fetchNotifications();
                    fetchSentNotifications();
                }}
            />
        </AdminPageShell>
    );
}

// Notification Row Component
function NotificationRow({
    notification,
    onMarkRead,
    onDelete,
    onArchive,
}: {
    notification: Notification;
    onMarkRead: () => void;
    onDelete: () => void;
    onArchive: () => void;
}) {
    const sender = notification.sender as AdminUserBasic | undefined;

    return (
        <div className={`flex items-start gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-gray-50 transition-colors ${!notification.is_read ? "bg-blue-50/50" : ""}`}>
            {/* Unread indicator */}
            <div className="pt-2 shrink-0">
                {!notification.is_read ? (
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                ) : (
                    <div className="w-2 h-2" />
                )}
            </div>

            {/* Avatar */}
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 ${sender ? "bg-blue-100" : "bg-gray-100"}`}>
                {sender ? (
                    sender.avatar_url ? (
                        <Image
                            src={sender.avatar_url}
                            alt={sender.full_name || sender.email}
                            width={48}
                            height={48}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                        />
                    ) : (
                        <span className="text-sm sm:text-lg font-semibold text-blue-600">
                            {(sender.full_name || sender.email)[0].toUpperCase()}
                        </span>
                    )
                ) : (
                    <span className="text-base sm:text-xl">{NOTIFICATION_ICONS[notification.type]}</span>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center flex-wrap gap-2 mb-1">
                            <span className={`font-semibold text-sm sm:text-base ${!notification.is_read ? PRIORITY_COLORS[notification.priority] : "text-gray-900"}`}>
                                {notification.title}
                            </span>
                            {notification.priority === "urgent" && (
                                <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-700 rounded-full">
                                    URGENT
                                </span>
                            )}
                            {notification.priority === "high" && (
                                <span className="px-2 py-0.5 text-xs font-bold bg-orange-100 text-orange-700 rounded-full">
                                    HIGH
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1.5 sm:mb-2">{notification.message}</p>
                        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs sm:text-sm text-gray-500">
                            {sender && <span>From: {sender.full_name || sender.email}</span>}
                            <span>&bull;</span>
                            <span title={format(new Date(notification.created_at), "PPpp")}>
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </span>
                            {notification.is_read && notification.read_at && (
                                <>
                                    <span>&bull;</span>
                                    <span className="text-green-600">Read</span>
                                </>
                            )}
                        </div>
                        {notification.action_url && notification.action_label && (
                            <a
                                href={notification.action_url}
                                className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
                            >
                                {notification.action_label}
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </a>
                        )}
                    </div>

                    {/* Actions — hidden on mobile, visible on sm+ */}
                    <div className="hidden sm:flex items-center gap-1 shrink-0">
                        {!notification.is_read && (
                            <button
                                onClick={onMarkRead}
                                className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                                title="Mark as read"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </button>
                        )}
                        <button
                            onClick={onArchive}
                            className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                            title="Archive"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                        </button>
                        <button
                            onClick={onDelete}
                            className="p-2 rounded-lg hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors"
                            title="Delete"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile-only action row */}
                <div className="flex sm:hidden items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                    {!notification.is_read && (
                        <button
                            onClick={onMarkRead}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors touch-manipulation"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Mark read
                        </button>
                    )}
                    <button
                        onClick={onArchive}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors touch-manipulation"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                        Archive
                    </button>
                    <button
                        onClick={onDelete}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors touch-manipulation"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

// Sent Notification Row Component
function SentNotificationRow({ notification }: { notification: SentNotification }) {
    const recipient = notification.recipient as AdminUserBasic | undefined;

    return (
        <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-gray-50 transition-colors">
            {/* Sent indicator */}
            <div className="pt-2 shrink-0">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
            </div>

            {/* Recipient Avatar */}
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 ${recipient ? "bg-purple-100" : "bg-gray-100"}`}>
                {recipient ? (
                    recipient.avatar_url ? (
                        <Image
                            src={recipient.avatar_url}
                            alt={recipient.full_name || recipient.email}
                            width={48}
                            height={48}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                        />
                    ) : (
                        <span className="text-sm sm:text-lg font-semibold text-purple-600">
                            {(recipient.full_name || recipient.email)[0].toUpperCase()}
                        </span>
                    )
                ) : (
                    <span className="text-base sm:text-xl">{NOTIFICATION_ICONS[notification.type]}</span>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                {/* Title row — type badge sits here on desktop only */}
                <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center flex-wrap gap-2 min-w-0">
                        <span className="font-semibold text-sm sm:text-base text-gray-900">{notification.title}</span>
                        {notification.priority === "urgent" && (
                            <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-700 rounded-full">URGENT</span>
                        )}
                        {notification.priority === "high" && (
                            <span className="px-2 py-0.5 text-xs font-bold bg-orange-100 text-orange-700 rounded-full">HIGH</span>
                        )}
                    </div>
                    {/* Type badge — right-aligned on sm+ */}
                    <span className="hidden sm:inline-flex shrink-0 px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full capitalize">
                        {notification.type.replace(/_/g, " ")}
                    </span>
                </div>

                <p className="text-sm text-gray-600 mb-1.5 sm:mb-2">{notification.message}</p>

                {/* Meta row — type badge is inline here on mobile */}
                <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs sm:text-sm text-gray-500">
                    {/* Type badge inline on mobile */}
                    <span className="sm:hidden inline-flex px-1.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-full capitalize">
                        {notification.type.replace(/_/g, " ")}
                    </span>
                    {recipient && (
                        <span className="flex items-center gap-1">
                            <span className="text-gray-400">To:</span>
                            <span className="font-medium text-gray-700">{recipient.full_name || recipient.email}</span>
                            <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">{recipient.role}</span>
                        </span>
                    )}
                    <span>&bull;</span>
                    <span title={format(new Date(notification.created_at), "PPpp")}>
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </span>
                    <span>&bull;</span>
                    {notification.is_read ? (
                        <span className="flex items-center gap-1 text-green-600">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Read
                        </span>
                    ) : (
                        <span className="text-amber-500">Unread</span>
                    )}
                </div>

                {notification.action_url && notification.action_label && (
                    <a
                        href={notification.action_url}
                        className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                        {notification.action_label}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </a>
                )}
            </div>
        </div>
    );
}
