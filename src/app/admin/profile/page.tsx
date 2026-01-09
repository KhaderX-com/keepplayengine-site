"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Shield, Calendar, CheckCircle2 } from "lucide-react";

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Calculate session expiry time once during component initialization
    const [sessionExpiryTime] = useState(() => {
        return new Date(Date.now() + 2 * 60 * 60 * 1000).toLocaleString();
    });

    const handleToggleMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    }, [isMobileMenuOpen]);

    const handleCloseMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(false);
    }, []);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/admin/login");
        }
    }, [status, router]);

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!session?.user) {
        return null;
    }

    const user = session.user;
    const initials = user.name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase() || 'A';

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar */}
            <AdminSidebar
                isMobileMenuOpen={isMobileMenuOpen}
                onCloseMobileMenu={handleCloseMobileMenu}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <AdminHeader
                    user={user}
                    onToggleMobileMenu={handleToggleMobileMenu}
                    title="My Profile"
                    subtitle="Manage your account information"
                />

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto">
                    <div className="container max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">

                        <div className="grid gap-6">
                            {/* Profile Overview Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Profile Overview</CardTitle>
                                    <CardDescription>Your account details and role information</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col sm:flex-row items-start gap-6">
                                        <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                                            <AvatarImage src={user.image || undefined} alt={user.name || 'Admin'} />
                                            <AvatarFallback className="text-xl sm:text-2xl bg-blue-100 text-blue-600">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 space-y-4">
                                            <div>
                                                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900">{user.name}</h3>
                                                <p className="text-gray-500 flex items-center gap-2 mt-1 text-sm sm:text-base">
                                                    <Mail className="h-4 w-4" />
                                                    {user.email}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <Badge variant="default" className="flex items-center gap-1">
                                                    <Shield className="h-3 w-3" />
                                                    {user.role || 'Admin'}
                                                </Badge>
                                                <Badge variant="outline" className="flex items-center gap-1">
                                                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                                                    Active
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Account Information Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Account Information</CardTitle>
                                    <CardDescription>View your account details</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="name" className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                Full Name
                                            </Label>
                                            <Input
                                                id="name"
                                                value={user.name || ''}
                                                readOnly
                                                className="bg-gray-50"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="email" className="flex items-center gap-2">
                                                <Mail className="h-4 w-4" />
                                                Email Address
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={user.email || ''}
                                                readOnly
                                                className="bg-gray-50"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="role" className="flex items-center gap-2">
                                                <Shield className="h-4 w-4" />
                                                Role
                                            </Label>
                                            <Input
                                                id="role"
                                                value={user.role || 'Admin'}
                                                readOnly
                                                className="bg-gray-50"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="userId" className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                User ID
                                            </Label>
                                            <Input
                                                id="userId"
                                                value={user.id || ''}
                                                readOnly
                                                className="bg-gray-50 font-mono text-sm"
                                            />
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-3">
                                        <h4 className="text-sm font-medium text-gray-700">Session Information</h4>
                                        <div className="text-sm text-gray-600 space-y-1">
                                            <p className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                Session expires: {sessionExpiryTime}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-2">
                                                For security reasons, your session will automatically expire after 2 hours of activity.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Security Notice */}
                            <Card className="border-blue-200 bg-blue-50">
                                <CardContent className="pt-6">
                                    <div className="flex gap-3">
                                        <Shield className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-medium text-blue-900">Security Notice</h4>
                                            <p className="text-sm text-blue-700">
                                                To update your profile information or change your password, please contact a system administrator.
                                                Profile updates require admin-level permissions for security purposes.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
