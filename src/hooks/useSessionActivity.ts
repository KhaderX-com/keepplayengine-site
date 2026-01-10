"use client";

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Hook to track session activity
 * Updates session activity every 5 minutes for active users
 * Excludes admin@keepplayengine.com (dev account)
 */
export function useSessionActivity() {
    const { data: session } = useSession();

    useEffect(() => {
        if (!session || session.user.email === 'admin@keepplayengine.com') {
            return;
        }

        // Update immediately on mount
        updateActivity();

        // Update every 5 minutes
        const interval = setInterval(updateActivity, 5 * 60 * 1000);

        // Update on user interaction
        const handleInteraction = () => {
            updateActivity();
        };

        // Track user activity
        window.addEventListener('click', handleInteraction);
        window.addEventListener('keydown', handleInteraction);
        window.addEventListener('scroll', handleInteraction);

        return () => {
            clearInterval(interval);
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
            window.removeEventListener('scroll', handleInteraction);
        };
    }, [session]);
}

let lastUpdate = 0;
const MIN_UPDATE_INTERVAL = 2 * 60 * 1000; // Minimum 2 minutes between updates

async function updateActivity() {
    const now = Date.now();

    // Throttle updates to avoid too many API calls
    if (now - lastUpdate < MIN_UPDATE_INTERVAL) {
        return;
    }

    lastUpdate = now;

    try {
        await fetch('/api/admin/session-activity', {
            method: 'POST',
        });
    } catch (error) {
        console.error('Failed to update session activity:', error);
    }
}
