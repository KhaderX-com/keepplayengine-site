"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

interface SubNavItem {
    name: string;
    href: string;
    icon: React.ReactNode;
    badge?: string | number;
}

interface NavItem {
    name: string;
    icon: React.ReactNode;
    subItems: SubNavItem[];
    isExpanded?: boolean;
}

interface AdminSidebarProps {
    activeSessions?: number;
    isMobileMenuOpen: boolean;
    onCloseMobileMenu: () => void;
    userRole?: string;
}

export default function AdminSidebar({ activeSessions = 0, isMobileMenuOpen, onCloseMobileMenu, userRole }: AdminSidebarProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isAdminExpanded, setIsAdminExpanded] = useState(true);
    const [isTasksExpanded, setIsTasksExpanded] = useState(true);
    const [isKpeExpanded, setIsKpeExpanded] = useState(true);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobileMenuOpen]);

    // Close mobile menu on navigation - only when pathname or searchParams actually change
    useEffect(() => {
        if (isMobileMenuOpen) {
            onCloseMobileMenu();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname, searchParams]);

    const navigation: NavItem[] = [
        {
            name: "Admin",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                </svg>
            ),
            subItems: [
                {
                    name: "Dashboard",
                    href: "/admin",
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    ),
                },
                {
                    name: "Audit Logs",
                    href: "/admin/dashboard?tab=audit",
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    ),
                },
                {
                    name: "Active Sessions",
                    href: "/admin/dashboard?tab=sessions",
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    ),
                    badge: activeSessions,
                },
            ],
        },
        {
            name: "Task Manager",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
            ),
            subItems: [
                {
                    name: "Board",
                    href: "/admin/tasks",
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                        </svg>
                    ),
                },
                {
                    name: "Milestones",
                    href: "/admin/milestones",
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                        </svg>
                    ),
                },
                // Removed 'My Tasks' and 'All Tasks' entries per UI change request
                // Only show Label Management for SUPER_ADMIN
                ...(userRole === 'SUPER_ADMIN' ? [{
                    name: "Label Management",
                    href: "/admin/labels",
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                    ),
                }] : []),
            ],
        },
        {
            name: "KeepPlay Engine",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
            subItems: [
                {
                    name: "Overview",
                    href: "/admin/keepplay-engine",
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    ),
                },
                {
                    name: "User Management",
                    href: "/admin/keepplay-engine/users",
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    ),
                },
                {
                    name: "Loyalty App",
                    href: "/admin/keepplay-engine/loyalty-app",
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                        </svg>
                    ),
                },
                {
                    name: "App Keys",
                    href: "/admin/keepplay-engine/app-keys",
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    ),
                },
                {
                    name: "Ad Revenue",
                    href: "/admin/keepplay-engine/ad-revenue",
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    ),
                },
                {
                    name: "Withdrawals",
                    href: "/admin/keepplay-engine/withdrawals",
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                    ),
                },
            ],
        },
    ];

    return (
        <>
            {/* Mobile Overlay - PWA Optimized */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-45 lg:hidden transition-opacity"
                    onClick={onCloseMobileMenu}
                    role="button"
                    tabIndex={0}
                    aria-label="Close menu"
                    onKeyDown={(e) => {
                        if (e.key === 'Escape' || e.key === 'Enter') {
                            onCloseMobileMenu();
                        }
                    }}
                />
            )}

            {/* Sidebar - Mobile-First Responsive */}
            <aside
                className={`fixed left-0 top-0 h-screen bg-linear-to-b from-gray-900 via-gray-900 to-gray-800 border-r border-gray-700 transition-all duration-300 z-50 
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    ${isCollapsed ? "w-20" : "w-72 sm:w-80 lg:w-64"}`}
            >
                {/* Logo Section - Mobile Optimized */}
                <div className="h-16 lg:h-20 flex items-center justify-between px-3 lg:px-4 border-b border-gray-700">
                    {!isCollapsed && (
                        <div className="flex items-center space-x-2 lg:space-x-3">
                            <div className="w-9 h-9 lg:w-10 lg:h-10 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                                <svg
                                    className="w-5 h-5 lg:w-6 lg:h-6 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xs lg:text-sm font-bold text-white leading-tight">KeepPlay Engine</h1>
                                <p className="text-[10px] lg:text-xs text-blue-400 font-semibold">Admin Panel</p>
                            </div>
                        </div>
                    )}

                    {/* Mobile close button */}
                    <button
                        onClick={onCloseMobileMenu}
                        className="lg:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white active:scale-95"
                        aria-label="Close menu"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Desktop collapse button */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="hidden lg:block p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
                        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        <svg
                            className={`w-5 h-5 transition-transform ${isCollapsed ? "rotate-180" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                    </button>
                </div>

                {/* Navigation - Mobile Optimized with Touch Support */}
                <nav className="px-2 lg:px-3 py-4 lg:py-6 space-y-1 overflow-y-auto h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)] overscroll-contain">
                    {navigation.map((item, navIndex) => {
                        const isExpanded = navIndex === 0 ? isAdminExpanded : navIndex === 1 ? isTasksExpanded : isKpeExpanded;
                        const setExpanded = navIndex === 0 ? setIsAdminExpanded : navIndex === 1 ? setIsTasksExpanded : setIsKpeExpanded;

                        return (
                            <div key={item.name}>
                                {/* Main Nav Item - Touch Friendly */}
                                <button
                                    onClick={() => setExpanded(!isExpanded)}
                                    className="w-full flex items-center justify-between px-3 lg:px-4 py-3 rounded-lg transition-all group text-gray-300 hover:bg-gray-800 hover:text-white touch-manipulation active:scale-[0.98]"
                                >
                                    <div className="flex items-center space-x-2 lg:space-x-3">
                                        <span className="text-gray-400 group-hover:text-white">
                                            {item.icon}
                                        </span>
                                        {!isCollapsed && (
                                            <span className="font-medium text-sm">{item.name}</span>
                                        )}
                                    </div>
                                    {!isCollapsed && (
                                        <svg
                                            className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    )}
                                </button>

                                {/* Sub Items - Touch Optimized */}
                                {isExpanded && !isCollapsed && (
                                    <div className="ml-2 lg:ml-4 mt-1 space-y-1">
                                        {item.subItems.map((subItem) => {
                                            const currentTab = searchParams?.get("tab");
                                            const currentFilter = searchParams?.get("filter");
                                            let isActive = false;

                                            // Handle Admin section routes
                                            if (subItem.href === "/admin") {
                                                isActive = pathname === "/admin" && !currentTab;
                                            } else if (subItem.href.includes("?tab=")) {
                                                const itemTab = subItem.href.split("tab=")[1];
                                                isActive = (pathname === "/admin" || pathname === "/admin/dashboard") && currentTab === itemTab;
                                            }
                                            // Handle Task Manager routes
                                            else if (subItem.href === "/admin/tasks") {
                                                isActive = pathname === "/admin/tasks" && !currentFilter;
                                            } else if (subItem.href.includes("?filter=")) {
                                                const itemFilter = subItem.href.split("filter=")[1];
                                                isActive = pathname === "/admin/tasks" && currentFilter === itemFilter;
                                            } else {
                                                isActive = pathname === subItem.href;
                                            }

                                            return (
                                                <Link
                                                    key={subItem.name}
                                                    href={subItem.href}
                                                    className={`flex items-center justify-between px-3 lg:px-4 py-3 rounded-lg transition-all group touch-manipulation active:scale-[0.98]
                                                        ${isActive
                                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                                                            : "text-gray-400 hover:bg-gray-800 hover:text-white"
                                                        }`}
                                                >
                                                    <div className="flex items-center space-x-2 lg:space-x-3">
                                                        <span className={isActive ? "text-white" : "text-gray-500 group-hover:text-white"}>
                                                            {subItem.icon}
                                                        </span>
                                                        <span className="font-medium text-sm">{subItem.name}</span>
                                                    </div>
                                                    {subItem.badge !== undefined && subItem.badge !== 0 && (
                                                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full min-w-7 text-center
                                                            ${isActive ? "bg-white text-blue-600" : "bg-blue-600 text-white"}`}>
                                                            {subItem.badge}
                                                        </span>
                                                    )}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
}
