"use client";

import { useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

// Client-side Supabase instance for realtime subscriptions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
    if (!supabaseClient && typeof window !== 'undefined') {
        supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    }
    return supabaseClient;
}

interface UseNotificationRealtimeProps {
    userId?: string;
    onNewNotification?: (notification: unknown) => void;
    onNotificationRead?: (notificationId: string) => void;
}

/**
 * Hook for real-time notification subscriptions
 * Listens to new notifications and updates via Supabase Realtime
 */
export function useNotificationRealtime({
    userId,
    onNewNotification,
    onNotificationRead
}: UseNotificationRealtimeProps) {
    const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);

    const setupSubscription = useCallback(() => {
        if (!userId) return;

        const client = getSupabaseClient();
        if (!client) return;

        // Clean up existing subscription
        if (channelRef.current) {
            client.removeChannel(channelRef.current);
        }

        // Create new channel for this user's notifications
        const channel = client
            .channel(`notifications:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `recipient_id=eq.${userId}`
                },
                (payload) => {
                    console.log('New notification received:', payload.new);
                    onNewNotification?.(payload.new);

                    // Show browser notification if permission granted
                    if (Notification.permission === 'granted') {
                        const notification = payload.new as { title: string; message: string; action_url?: string };
                        showBrowserNotification(notification.title, notification.message, notification.action_url);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'notifications',
                    filter: `recipient_id=eq.${userId}`
                },
                (payload) => {
                    const updated = payload.new as { id: string; is_read: boolean };
                    if (updated.is_read) {
                        onNotificationRead?.(updated.id);
                    }
                }
            )
            .subscribe();

        channelRef.current = channel;
    }, [userId, onNewNotification, onNotificationRead]);

    useEffect(() => {
        setupSubscription();

        return () => {
            if (channelRef.current) {
                const client = getSupabaseClient();
                if (client) {
                    client.removeChannel(channelRef.current);
                }
            }
        };
    }, [setupSubscription]);
}

/**
 * Show a browser notification
 */
function showBrowserNotification(title: string, body: string, actionUrl?: string) {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    const notification = new Notification(title, {
        body,
        icon: '/admin-icon-192.png',
        badge: '/admin-icon-192.png',
        tag: 'admin-notification',
        requireInteraction: false,
        silent: false
    });

    notification.onclick = () => {
        window.focus();
        if (actionUrl) {
            window.location.href = actionUrl;
        }
        notification.close();
    };

    // Auto-close after 5 seconds
    setTimeout(() => notification.close(), 5000);
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        return 'denied';
    }

    if (Notification.permission === 'granted') {
        return 'granted';
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission;
    }

    return Notification.permission;
}

/**
 * Check if notifications are supported and enabled
 */
export function getNotificationStatus(): {
    supported: boolean;
    permission: NotificationPermission | 'unsupported';
} {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        return { supported: false, permission: 'unsupported' };
    }

    return {
        supported: true,
        permission: Notification.permission
    };
}
