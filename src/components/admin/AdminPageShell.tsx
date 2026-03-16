"use client";

import { useState, useCallback } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { useSessionActivity } from "@/hooks/useSessionActivity";
import { useFcmToken } from "@/hooks/use-fcm";

interface AdminPageShellProps {
    children: React.ReactNode;
    user?: {
        name?: string | null;
        email?: string | null;
        role?: string;
        image?: string | null;
        id?: string;
    };
    title?: string;
    subtitle?: string;
    activeSessions?: number;
    userRole?: string;
    className?: string;
}

export default function AdminPageShell({
    children,
    user,
    title,
    subtitle,
    activeSessions,
    userRole,
    className = "flex-1 overflow-y-auto",
}: AdminPageShellProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Track session activity (excludes admin@keepplayengine.com)
    useSessionActivity();

    // Auto-register FCM token for push notifications (web + PWA)
    useFcmToken();

    const handleToggleMobileMenu = useCallback(() => {
        setIsMobileMenuOpen((prev) => !prev);
    }, []);

    const handleCloseMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(false);
    }, []);

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <AdminSidebar
                activeSessions={activeSessions}
                isMobileMenuOpen={isMobileMenuOpen}
                onCloseMobileMenu={handleCloseMobileMenu}
                userRole={userRole}
            />
            <div className="flex-1 flex flex-col lg:ml-64 overflow-hidden">
                <AdminHeader
                    user={user}
                    onToggleMobileMenu={handleToggleMobileMenu}
                    title={title}
                    subtitle={subtitle}
                />
                <main className={className}>
                    {children}
                </main>
            </div>
        </div>
    );
}
