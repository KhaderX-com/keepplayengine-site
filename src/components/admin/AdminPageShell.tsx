"use client";

import { useState, useCallback } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { useSessionActivity } from "@/hooks/useSessionActivity";

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
    userRole?: string;
    className?: string;
}

export default function AdminPageShell({
    children,
    user,
    title,
    subtitle,
    userRole,
    className = "flex-1 overflow-y-auto",
}: AdminPageShellProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Track session activity (excludes admin@keepplayengine.com)
    useSessionActivity();

    const handleToggleMobileMenu = useCallback(() => {
        setIsMobileMenuOpen((prev) => !prev);
    }, []);

    const handleCloseMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(false);
    }, []);

    return (
        <div className="flex h-screen min-w-0 overflow-hidden bg-gray-50">
            <AdminSidebar
                isMobileMenuOpen={isMobileMenuOpen}
                onCloseMobileMenu={handleCloseMobileMenu}
                userRole={userRole}
            />
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden lg:ml-64">
                <AdminHeader
                    user={user}
                    onToggleMobileMenu={handleToggleMobileMenu}
                    title={title}
                    subtitle={subtitle}
                />
                <main className={`${className} min-w-0 overflow-x-hidden`}>
                    {children}
                </main>
            </div>
        </div>
    );
}
