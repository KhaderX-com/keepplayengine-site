"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

interface SubNavItem {
    name: string;
    href: string;
    icon: React.ReactNode;
    badge?: string | number;
    noInvert?: boolean;
}

interface NavItem {
    name: string;
    icon: React.ReactNode;
    subItems: SubNavItem[];
    isExpanded?: boolean;
}

interface AdminSidebarProps {
    isMobileMenuOpen: boolean;
    onCloseMobileMenu: () => void;
    userRole?: string;
}

export default function AdminSidebar({ isMobileMenuOpen, onCloseMobileMenu, userRole }: AdminSidebarProps) {
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
                        <Image src="https://res.cloudinary.com/destej60y/image/upload/v1774210808/dashboards_xvf9aq.png" alt="Dashboard" width={20} height={20} unoptimized />
                    ),
                },
                {
                    name: "Audit Logs",
                    href: "/admin/dashboard?tab=audit",
                    icon: (
                        <Image src="https://res.cloudinary.com/destej60y/image/upload/v1774210139/monitoring_wmdiob.png" alt="Audit Logs" width={20} height={20} unoptimized />
                    ),
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
                        <Image src="https://res.cloudinary.com/destej60y/image/upload/v1774210123/task_kkioyb.png" alt="Board" width={20} height={20} unoptimized />
                    ),
                },
                {
                    name: "Milestones",
                    href: "/admin/milestones",
                    icon: (
                        <Image src="https://res.cloudinary.com/destej60y/image/upload/v1774210123/flag_nml2il.png" alt="Milestones" width={20} height={20} unoptimized />
                    ),
                },
                // Removed 'My Tasks' and 'All Tasks' entries per UI change request
                // Only show Label Management for SUPER_ADMIN
                ...(userRole === 'SUPER_ADMIN' ? [{
                    name: "Label Management",
                    href: "/admin/labels",
                    icon: (
                        <Image src="https://res.cloudinary.com/destej60y/image/upload/v1774210122/tag_d3hn9f.png" alt="Label Management" width={20} height={20} unoptimized />
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
                        <Image src="https://res.cloudinary.com/destej60y/image/upload/v1773809280/Bolt_1_jwgn1c.png" alt="Engine Overview" width={20} height={20} unoptimized />
                    ),
                },
                {
                    name: "Loyalty App",
                    href: "/admin/keepplay-engine/loyalty-app",
                    noInvert: true,
                    icon: (
                        <Image src="https://res.cloudinary.com/destej60y/image/upload/v1774210382/KeepPlay_App_Icon_rounded_n1vlqo.png" alt="Loyalty App" width={20} height={20} unoptimized />
                    ),
                },
                {
                    name: "User Management",
                    href: "/admin/keepplay-engine/users",
                    icon: (
                        <Image src="https://res.cloudinary.com/destej60y/image/upload/v1774210122/multiple-users-silhouette_hu5qfy.png" alt="User Management" width={20} height={20} unoptimized />
                    ),
                },
                
                {
                    name: "App Keys",
                    href: "/admin/keepplay-engine/app-keys",
                    icon: (
                        <Image src="https://res.cloudinary.com/destej60y/image/upload/v1774210122/key_bz9dtz.png" alt="App Keys" width={20} height={20} unoptimized />
                    ),
                },
                {
                    name: "Ad Revenue",
                    href: "/admin/keepplay-engine/ad-revenue",
                    noInvert: true,
                    icon: (
                        <Image src="https://res.cloudinary.com/destej60y/image/upload/v1774817883/coin_1_ibq1jb.png" alt="Ad Revenue" width={20} height={20} unoptimized />
                    ),
                },
                {
                    name: "Withdrawals",
                    href: "/admin/keepplay-engine/withdrawals",
                    noInvert: true,
                    icon: (
                        <Image src="https://res.cloudinary.com/destej60y/image/upload/v1774211644/dollar-symbol-red_nvkotr.png" alt="Withdrawals" width={20} height={20} unoptimized />
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
                className={`fixed left-0 top-0 h-screen flex flex-col bg-gray-50 border-r border-gray-200 transition-all duration-300 z-50 overflow-hidden
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    ${isCollapsed ? "w-20" : "w-72 sm:w-80 lg:w-64"}`}
            >
                {/* Logo Section - Mobile Optimized */}
                <div className="h-16 lg:h-20 flex items-center justify-between px-3 lg:px-4 border-b border-gray-200">
                    {!isCollapsed && (
                        <div className="flex items-center space-x-2 lg:space-x-3">
                            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl overflow-hidden shrink-0">
                                <Image
                                    src="https://res.cloudinary.com/destej60y/image/upload/v1773809280/Bolt_1_jwgn1c.png"
                                    alt="KeepPlay Engine"
                                    width={40}
                                    height={40}
                                    className="w-full h-full object-cover"
                                    unoptimized
                                />
                            </div>
                            <div>
                                <h1 className="text-xs lg:text-sm font-bold text-gray-900 leading-tight">KeepPlay Engine</h1>
                                <p className="text-[10px] lg:text-xs text-gray-500 font-semibold">Admin Panel</p>
                            </div>
                        </div>
                    )}

                    {/* Mobile close button */}
                    <button
                        onClick={onCloseMobileMenu}
                        className="lg:hidden p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-900 active:scale-95"
                        aria-label="Close menu"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Desktop collapse button */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="hidden lg:block p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-900"
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
                <nav className="flex-1 min-h-0 px-2 lg:px-3 py-4 lg:py-6 space-y-1 overflow-y-auto overscroll-contain">
                    {navigation.map((item, navIndex) => {
                        const isExpanded = navIndex === 0 ? isAdminExpanded : navIndex === 1 ? isTasksExpanded : isKpeExpanded;
                        const setExpanded = navIndex === 0 ? setIsAdminExpanded : navIndex === 1 ? setIsTasksExpanded : setIsKpeExpanded;

                        return (
                            <div key={item.name}>
                                {/* Section Header - Touch Friendly */}
                                <button
                                    onClick={() => setExpanded(!isExpanded)}
                                    className="w-full flex items-center justify-between px-3 lg:px-4 py-2.5 rounded-lg transition-all group text-gray-500 hover:bg-gray-200/70 hover:text-gray-900 touch-manipulation active:scale-[0.98]"
                                >
                                    <div className="flex items-center space-x-2 lg:space-x-3">
                                        <span className="text-gray-400 group-hover:text-gray-700">
                                            {item.icon}
                                        </span>
                                        {!isCollapsed && (
                                            <span className="font-semibold text-xs uppercase tracking-wider">{item.name}</span>
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
                                    <div className="ml-2 lg:ml-3 mt-1 space-y-0.5">
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
                                                // Use startsWith only for deep paths (e.g. /admin/section/sub),
                                                // not for section roots (e.g. /admin/keepplay-engine) which
                                                // would incorrectly match all children.
                                                const isDeepPath = subItem.href.split("/").length > 3;
                                                isActive = pathname === subItem.href || (isDeepPath && pathname.startsWith(subItem.href + "/"));
                                            }

                                            return (
                                                <Link
                                                    key={subItem.name}
                                                    href={subItem.href}
                                                    className={`flex items-center justify-between px-3 lg:px-4 py-2.5 rounded-full transition-all group touch-manipulation active:scale-[0.98]
                                                        ${isActive
                                                            ? "bg-black text-white"
                                                            : "text-gray-600 hover:bg-gray-500 hover:text-white"
                                                        }`}
                                                >
                                                    <div className="flex items-center space-x-2 lg:space-x-3">
                                                        <span
                                                            className={isActive ? "text-white" : "text-gray-400 group-hover:text-white"}
                                                            style={isActive && !subItem.noInvert ? { filter: 'brightness(0) invert(1)' } : undefined}
                                                        >
                                                            {subItem.icon}
                                                        </span>
                                                        <span className="font-medium text-sm">{subItem.name}</span>
                                                    </div>
                                                    {subItem.badge !== undefined && subItem.badge !== 0 && (
                                                        <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full min-w-7 text-center
                                                            ${isActive ? "bg-white text-black" : "bg-black text-white"}`}>
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
