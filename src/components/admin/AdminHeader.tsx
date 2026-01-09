"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { NotificationBell } from "@/components/notifications";

interface AdminHeaderProps {
    user?: {
        name?: string | null;
        email?: string | null;
        role?: string;
        image?: string | null;
    };
    onToggleMobileMenu: () => void;
    title?: string;
    subtitle?: string;
}

export default function AdminHeader({ user, onToggleMobileMenu, title = "Dashboard", subtitle = "Welcome back to your admin panel" }: AdminHeaderProps) {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const router = useRouter();

    return (
        <header className="h-14 sm:h-16 lg:h-20 bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="h-full px-3 sm:px-4 lg:px-6 flex items-center justify-between">
                {/* Left Section - Mobile Menu + Title */}
                <div className="flex items-center space-x-2 sm:space-x-3">
                    {/* Mobile Menu Button */}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onToggleMobileMenu();
                        }}
                        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900 touch-manipulation active:scale-95 z-20"
                        aria-label="Open menu"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    {/* Page Title / Breadcrumb - Responsive */}
                    <div>
                        <h2 className="text-base sm:text-lg lg:text-2xl font-bold text-gray-900">{title}</h2>
                        {subtitle && <p className="hidden sm:block text-xs lg:text-sm text-gray-500 mt-0.5">{subtitle}</p>}
                    </div>
                </div>

                {/* Right Section - PWA Optimized */}
                <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
                    {/* Security badge removed per request */}

                    {/* Notifications - Using the new NotificationBell component */}
                    <NotificationBell className="flex items-center" />

                    {/* User Menu - Mobile Responsive */}
                    <div className="relative">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center space-x-2 p-1.5 sm:p-2 pr-2 sm:pr-3 lg:pr-4 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation active:scale-95"
                            aria-label="User menu"
                        >
                            <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-blue-600 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                                {user?.image ? (
                                    <img
                                        src={user.image}
                                        alt={user?.name || user?.email || "User"}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-white font-bold text-sm">
                                        {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "A"}
                                    </span>
                                )}
                            </div>
                            <div className="text-left hidden sm:hidden lg:block">
                                <p className="text-xs lg:text-sm font-semibold text-gray-900 truncate max-w-25 lg:max-w-none">
                                    {user?.name || user?.email?.split("@")[0]}
                                </p>
                                <p className="text-[10px] lg:text-xs text-blue-600 font-medium">
                                    {user?.role || "Admin"}
                                </p>
                            </div>
                            <svg className="w-4 h-4 text-gray-600 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Dropdown Menu - Mobile Optimized */}
                        {showUserMenu && (
                            <>
                                {/* Mobile Backdrop */}
                                <div
                                    className="fixed inset-0 z-40 lg:hidden"
                                    onClick={() => setShowUserMenu(false)}
                                />

                                {/* Dropdown */}
                                <div className="absolute right-0 mt-2 w-64 sm:w-72 lg:w-56 bg-white rounded-lg border border-gray-200 shadow-xl py-2 z-50">
                                    <div className="px-4 py-3 border-b border-gray-100">
                                        <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || user?.email}</p>
                                        <p className="text-xs text-gray-500 mt-0.5 truncate">{user?.email}</p>
                                        <p className="text-xs text-blue-600 font-medium mt-1">{user?.role || "Admin"}</p>
                                    </div>

                                    {/* Menu Items - Touch Friendly */}
                                    <button
                                        onClick={() => {
                                            setShowUserMenu(false);
                                            // Settings action
                                        }}
                                        className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 touch-manipulation active:bg-gray-100"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span>Settings</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            setShowUserMenu(false);
                                            router.push('/admin/profile');
                                        }}
                                        className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 touch-manipulation active:bg-gray-100"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        <span>Profile</span>
                                    </button>

                                    <div className="border-t border-gray-100 my-1"></div>

                                    <button
                                        onClick={() => {
                                            setShowUserMenu(false);
                                            signOut({ callbackUrl: "/" });
                                        }}
                                        className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3 touch-manipulation active:bg-red-100"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        <span>Sign Out</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
