'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import LabelManagement from '@/components/admin/LabelManagement';

export default function LabelsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Auth redirect
    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (status === 'unauthenticated') {
        router.push('/admin/login');
        return null;
    }

    // Only SUPER_ADMIN can access this page
    if (session?.user?.role !== 'SUPER_ADMIN') {
        router.push('/admin');
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            {/* Sidebar */}
            <AdminSidebar
                isMobileMenuOpen={isMobileMenuOpen}
                onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
                userRole={session?.user?.role}
            />

            {/* Main Content */}
            <div className="lg:pl-64">
                {/* Header */}
                <AdminHeader
                    user={session?.user}
                    onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
                    title="Label Management"
                    subtitle="Manage task labels for better organization"
                />

                {/* Page Content */}
                <main className="p-4 sm:p-6 lg:p-8 pt-6 lg:pt-8">
                    <LabelManagement />
                </main>
            </div>
        </div>
    );
}
