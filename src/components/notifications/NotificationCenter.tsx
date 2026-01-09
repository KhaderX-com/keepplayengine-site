"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';
import type { Notification, AdminUserBasic } from '@/types/notifications';
import { NOTIFICATION_ICONS, PRIORITY_COLORS, PRIORITY_BG_COLORS } from '@/types/notifications';

interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
    onUnreadCountChange?: (count: number) => void;
}

export default function NotificationCenter({ isOpen, onClose, onUnreadCountChange }: NotificationCenterProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState<'all' | 'unread'>('all');
    const panelRef = useRef<HTMLDivElement>(null);

    // Fetch notifications
    const fetchNotifications = useCallback(async () => {
        try {
            const params = new URLSearchParams({
                limit: '30',
                unreadOnly: selectedTab === 'unread' ? 'true' : 'false'
            });

            const response = await fetch(`/api/notifications?${params}`);
            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications);
                setUnreadCount(data.unread_count);
                onUnreadCountChange?.(data.unread_count);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedTab, onUnreadCountChange]);

    // Mark as read
    const markAsRead = async (notificationIds?: string[]) => {
        try {
            const response = await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'mark_read',
                    notificationIds
                })
            });

            if (response.ok) {
                const data = await response.json();
                setUnreadCount(data.unread_count);
                onUnreadCountChange?.(data.unread_count);

                // Update local state
                setNotifications(prev => prev.map(n =>
                    (!notificationIds || notificationIds.includes(n.id))
                        ? { ...n, is_read: true, read_at: new Date().toISOString() }
                        : n
                ));
            }
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    // Delete notification
    const deleteNotification = async (id: string, archive = false) => {
        try {
            const response = await fetch(`/api/notifications/${id}?archive=${archive}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setNotifications(prev => prev.filter(n => n.id !== id));
                // Refetch to update counts
                fetchNotifications();
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen, fetchNotifications]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/20 z-40 md:hidden"
                onClick={onClose}
            />

            {/* Notification Panel */}
            <div
                ref={panelRef}
                className="fixed md:absolute left-2 right-2 md:left-auto md:right-0 top-16 md:top-full mt-2 w-auto md:w-96 lg:w-[420px] max-h-[calc(100vh-5rem)] md:max-h-[80vh] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200"
            >
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-100 z-10">
                    <div className="px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation active:scale-95"
                            title="Close notifications"
                            aria-label="Close notifications"
                        >
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex px-3 sm:px-4 gap-1">
                        <button
                            onClick={() => setSelectedTab('all')}
                            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-2 text-sm font-medium rounded-t-lg transition-colors touch-manipulation active:scale-95 ${selectedTab === 'all'
                                ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setSelectedTab('unread')}
                            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center justify-center gap-1 touch-manipulation active:scale-95 ${selectedTab === 'unread'
                                ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            Unread
                            {unreadCount > 0 && (
                                <span className="w-5 h-5 text-xs bg-red-500 text-white rounded-full flex items-center justify-center">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Actions Bar */}
                {unreadCount > 0 && (
                    <div className="px-3 sm:px-4 py-2 bg-gray-50 border-b border-gray-100 flex justify-end">
                        <button
                            onClick={() => markAsRead()}
                            className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 touch-manipulation active:scale-95 p-1.5 sm:p-1 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="hidden sm:inline">Mark all as read</span>
                            <span className="sm:hidden">Mark all</span>
                        </button>
                    </div>
                )}

                {/* Notification List */}
                <div className="overflow-y-auto max-h-[calc(100vh-15rem)] sm:max-h-[60vh] divide-y divide-gray-100">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </div>
                            <p className="text-gray-600 font-medium">No notifications</p>
                            <p className="text-sm text-gray-400 mt-1">You&apos;re all caught up!</p>
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onMarkRead={() => markAsRead([notification.id])}
                                onDelete={() => deleteNotification(notification.id)}
                                onArchive={() => deleteNotification(notification.id, true)}
                            />
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-4 py-3">
                    <Link
                        href="/admin/notifications"
                        className="block text-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                    >
                        View all notifications →
                    </Link>
                </div>
            </div>
        </>
    );
}

// Individual Notification Item Component
function NotificationItem({
    notification,
    onMarkRead,
    onDelete,
    onArchive
}: {
    notification: Notification;
    onMarkRead: () => void;
    onDelete: () => void;
    onArchive: () => void;
}) {
    const sender = notification.sender as AdminUserBasic | undefined;

    return (
        <div
            className={`relative group px-3 sm:px-4 py-3 sm:py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer touch-manipulation ${!notification.is_read ? PRIORITY_BG_COLORS[notification.priority] : ''
                }`}
            onClick={() => {
                if (!notification.is_read) {
                    onMarkRead();
                }
                if (notification.action_url) {
                    window.location.href = notification.action_url;
                }
            }}
        >
            {/* Unread indicator */}
            {!notification.is_read && (
                <div className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full" />
            )}

            <div className="flex items-start gap-2 sm:gap-3 pl-1 sm:pl-2">
                {/* Avatar or Icon */}
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${sender ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                    {sender ? (
                        sender.avatar_url ? (
                            <Image
                                src={sender.avatar_url}
                                alt={sender.full_name || sender.email}
                                width={40}
                                height={40}
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
                            />
                        ) : (
                            <span className="text-xs sm:text-sm font-semibold text-blue-600">
                                {(sender.full_name || sender.email)[0].toUpperCase()}
                            </span>
                        )
                    ) : (
                        <span className="text-base sm:text-lg">
                            {NOTIFICATION_ICONS[notification.type]}
                        </span>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-8 sm:pr-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-sm font-semibold ${!notification.is_read ? PRIORITY_COLORS[notification.priority] : 'text-gray-900'
                            }`}>
                            {notification.title}
                        </span>
                        {notification.priority === 'urgent' && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 rounded uppercase">
                                Urgent
                            </span>
                        )}
                        {notification.priority === 'high' && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-orange-100 text-orange-700 rounded uppercase">
                                High
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                        {notification.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                        {sender && (
                            <span className="text-xs text-gray-500">
                                from {sender.full_name || sender.email}
                            </span>
                        )}
                        <span className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                    </div>
                    {notification.action_url && notification.action_label && (
                        <a
                            href={notification.action_url}
                            className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-blue-600 hover:text-blue-800"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {notification.action_label}
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </a>
                    )}
                </div>

                {/* Actions */}
                <div className={`absolute right-2 sm:right-3 top-3 sm:top-4 flex items-center gap-0.5 sm:gap-1 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 opacity-100`}>
                    {!notification.is_read && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onMarkRead();
                            }}
                            className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-200 active:bg-gray-300 text-gray-500 hover:text-gray-700 touch-manipulation transition-colors"
                            title="Mark as read"
                            aria-label="Mark as read"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </button>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onArchive();
                        }}
                        className="hidden sm:block p-1.5 sm:p-2 rounded-lg hover:bg-gray-200 active:bg-gray-300 text-gray-500 hover:text-gray-700 touch-manipulation transition-colors"
                        title="Archive"
                        aria-label="Archive"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="p-1.5 sm:p-2 rounded-lg hover:bg-red-100 active:bg-red-200 text-gray-500 hover:text-red-600 touch-manipulation transition-colors"
                        title="Delete"
                        aria-label="Delete"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
