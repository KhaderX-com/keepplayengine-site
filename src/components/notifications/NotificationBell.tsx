"use client";

import { useState, useEffect, useCallback } from 'react';
import NotificationCenter from './NotificationCenter';
import SendNotificationModal from './SendNotificationModal';

interface NotificationBellProps {
    className?: string;
}

export default function NotificationBell({ className = '' }: NotificationBellProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showSendModal, setShowSendModal] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Fetch unread count function for manual refreshes
    const fetchUnreadCount = useCallback(async () => {
        try {
            const response = await fetch('/api/notifications/count');
            if (response.ok) {
                const data = await response.json();
                setUnreadCount(data.unread_count);
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    }, []);

    // Fetch on mount and set up polling
    useEffect(() => {
        // Using AbortController to properly manage the async fetch
        const controller = new AbortController();
        let isMounted = true;

        const doFetch = async () => {
            try {
                const response = await fetch('/api/notifications/count', { signal: controller.signal });
                if (response.ok && isMounted) {
                    const data = await response.json();
                    setUnreadCount(data.unread_count);
                }
            } catch (error) {
                // Ignore abort errors
                if ((error as Error).name !== 'AbortError') {
                    console.error('Error fetching unread count:', error);
                }
            }
        };

        // Initial fetch
        doFetch();

        // Poll every 30 seconds for new notifications
        const interval = setInterval(doFetch, 30000);

        return () => {
            isMounted = false;
            controller.abort();
            clearInterval(interval);
        };
    }, []);

    return (
        <div className={`relative ${className}`}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900 touch-manipulation active:scale-95"
                aria-label="Notifications"
            >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>

                {/* Unread Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 px-1 text-[10px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center animate-in zoom-in duration-200">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Center Dropdown */}
            <NotificationCenter
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                onUnreadCountChange={setUnreadCount}
            />

            {/* Quick Send Button (appears next to bell) */}
            <button
                onClick={() => setShowSendModal(true)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-blue-600 touch-manipulation active:scale-95"
                aria-label="Send notification"
                title="Send notification to team"
            >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
            </button>

            {/* Send Notification Modal */}
            <SendNotificationModal
                isOpen={showSendModal}
                onClose={() => setShowSendModal(false)}
                onSuccess={fetchUnreadCount}
            />
        </div>
    );
}
