"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
    const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
    const router = useRouter();

    return (
        <>
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

                    {/* User Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-gray-100 transition-colors touch-manipulation active:scale-95"
                            aria-label="User menu"
                        >
                            {/* Avatar */}
                            <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                                {user?.image ? (
                                    <Image
                                        src={user.image}
                                        alt={user?.name || user?.email || "User"}
                                        width={36}
                                        height={36}
                                        className="w-full h-full object-cover rounded-full"
                                    />
                                ) : (
                                    <span className="text-white font-bold text-sm">
                                        {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "A"}
                                    </span>
                                )}
                            </div>
                            {/* Name + role — desktop only */}
                            <div className="hidden lg:block text-left">
                                <p className="text-sm font-semibold text-gray-900 leading-tight truncate max-w-32">
                                    {user?.name || user?.email?.split("@")[0]}
                                </p>
                                <p className="text-[11px] text-gray-400 leading-tight truncate max-w-32">
                                    {user?.role || "Admin"}
                                </p>
                            </div>
                            <svg
                                className={`w-4 h-4 text-gray-400 transition-transform duration-200 hidden sm:block ${showUserMenu ? "rotate-180" : ""}`}
                                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Dropdown */}
                        {showUserMenu && (
                            <>
                                {/* Backdrop */}
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowUserMenu(false)}
                                />

                                <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl border border-gray-100 shadow-2xl p-2 z-50">

                                    {/* User info header */}
                                    <div className="flex items-center gap-3 px-3 py-3 mb-1">
                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                                            {user?.image ? (
                                                <Image
                                                    src={user.image}
                                                    alt={user?.name || "User"}
                                                    width={48}
                                                    height={48}
                                                    className="w-full h-full object-cover rounded-full"
                                                />
                                            ) : (
                                                <span className="text-white font-bold text-lg">
                                                    {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "A"}
                                                </span>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-gray-900 truncate">
                                                {user?.name || user?.email?.split("@")[0]}
                                            </p>
                                            <p className="text-xs text-gray-400 truncate mt-0.5">
                                                {user?.email}
                                            </p>
                                            <span className="inline-block mt-1.5 px-2.5 py-0.5 bg-black text-white text-[10px] font-bold rounded-full tracking-wide">
                                                {user?.role || "Admin"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-100 mb-1" />

                                    {/* Settings */}
                                    <button
                                        onClick={() => setShowUserMenu(false)}
                                        className="w-full px-3 py-2.5 text-left rounded-xl flex items-center gap-3 hover:bg-gray-50 transition-colors touch-manipulation"
                                    >
                                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">Settings</span>
                                    </button>

                                    {/* Profile */}
                                    <button
                                        onClick={() => { setShowUserMenu(false); router.push("/admin/profile"); }}
                                        className="w-full px-3 py-2.5 text-left rounded-xl flex items-center gap-3 hover:bg-gray-50 transition-colors touch-manipulation"
                                    >
                                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">Profile</span>
                                    </button>

                                    <div className="border-t border-gray-100 my-1" />

                                    {/* Sign Out */}
                                    <button
                                        onClick={() => { setShowUserMenu(false); setShowSignOutConfirm(true); }}
                                        className="w-full px-3 py-2.5 text-left rounded-xl flex items-center gap-3 hover:bg-red-50 transition-colors touch-manipulation"
                                    >
                                        <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                        </div>
                                        <span className="text-sm font-medium text-red-500">Sign Out</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>

            {/* Sign Out Confirmation Modal */}
            {showSignOutConfirm && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                        onClick={() => setShowSignOutConfirm(false)}
                    />
                    {/* Dialog */}
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col items-center gap-4">
                        {/* Icon */}
                        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center">
                            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </div>
                        <div className="text-center">
                            <p className="text-base font-bold text-gray-900">Sign out?</p>
                            <p className="text-sm text-gray-400 mt-1">You will be redirected to the login page.</p>
                        </div>
                        <div className="flex gap-3 w-full mt-1">
                            <button
                                onClick={() => setShowSignOutConfirm(false)}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => { setShowSignOutConfirm(false); signOut({ callbackUrl: "/" }); }}
                                className="flex-1 py-2.5 rounded-xl bg-black text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
