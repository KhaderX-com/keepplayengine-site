import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AdminPageShell from "@/components/admin/AdminPageShell";
import Link from "next/link";
import Image from "next/image";

interface NavCard {
    title: string;
    description: string;
    href: string;
    icon: React.ReactNode;
}

export default async function AdminPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        redirect("/admin/login");
    }

    const user = session.user;
    const userRole = user.role || "ADMIN";

    const navCards: NavCard[] = [
        {
            title: "System Monitoring",
            description: "View audit logs and track system activities",
            href: "/admin/dashboard?tab=audit",
            icon: (
                <Image src="https://res.cloudinary.com/destej60y/image/upload/v1774210139/monitoring_wmdiob.png" alt="System Monitoring" width={24} height={24} unoptimized />
            ),
        },
        {
            title: "Task Board",
            description: "Manage tasks with kanban board view",
            href: "/admin/tasks",
            icon: (
                <Image src="https://res.cloudinary.com/destej60y/image/upload/v1774210123/task_kkioyb.png" alt="Task Board" width={24} height={24} unoptimized />
            ),
        },
        {
            title: "Milestones",
            description: "Track project milestones and progress",
            href: "/admin/milestones",
            icon: (
                <Image src="https://res.cloudinary.com/destej60y/image/upload/v1774210123/flag_nml2il.png" alt="Milestones" width={24} height={24} unoptimized />
            ),
        },
        {
            title: "Notifications",
            description: "Send and manage system notifications",
            href: "/admin/notifications",
            icon: (
                <Image src="https://res.cloudinary.com/destej60y/image/upload/v1774210122/notification_ropjzw.png" alt="Notifications" width={24} height={24} unoptimized />
            ),
        },
        ...(userRole === "SUPER_ADMIN"
            ? [
                  {
                      title: "Label Management",
                      description: "Create and organize task labels",
                      href: "/admin/labels",
                      icon: (
                          <Image src="https://res.cloudinary.com/destej60y/image/upload/v1774210122/tag_d3hn9f.png" alt="Label Management" width={24} height={24} unoptimized />
                      ),
                  } as NavCard,
              ]
            : []),
        {
            title: "User Management",
            description: "Manage platform users and permissions",
            href: "/admin/keepplay-engine/users",
            icon: (
                <Image src="https://res.cloudinary.com/destej60y/image/upload/v1774210122/multiple-users-silhouette_hu5qfy.png" alt="User Management" width={24} height={24} unoptimized />
            ),
        },
        {
            title: "Loyalty App",
            description: "Manage loyalty programs and rewards",
            href: "/admin/keepplay-engine/loyalty-app",
            icon: (
                <Image src="https://res.cloudinary.com/destej60y/image/upload/v1774210382/KeepPlay_App_Icon_rounded_n1vlqo.png" alt="Loyalty App" width={24} height={24} unoptimized />
            ),
        },
        {
            title: "App Keys",
            description: "Manage API keys and integrations",
            href: "/admin/keepplay-engine/app-keys",
            icon: (
                <Image src="https://res.cloudinary.com/destej60y/image/upload/v1774210122/key_bz9dtz.png" alt="App Keys" width={24} height={24} unoptimized />
            ),
        },
        {
            title: "Ad Revenue",
            description: "Monitor advertising revenue and analytics",
            href: "/admin/keepplay-engine/ad-revenue",
            icon: (
                <Image src="https://res.cloudinary.com/destej60y/image/upload/v1774210122/coin_j3owuh.png" alt="Ad Revenue" width={24} height={24} unoptimized />
            ),
        },
        {
            title: "Withdrawals",
            description: "Process and review withdrawal requests",
            href: "/admin/keepplay-engine/withdrawals",
            icon: (
                <Image src="https://res.cloudinary.com/destej60y/image/upload/v1774211644/dollar-symbol-red_nvkotr.png" alt="Withdrawals" width={24} height={24} unoptimized />
            ),
        },
        {
            title: "Engine Overview",
            description: "High-level overview of the KeepPlay engine",
            href: "/admin/keepplay-engine",
            icon: (
                <Image src="https://res.cloudinary.com/destej60y/image/upload/v1773809280/Bolt_1_jwgn1c.png" alt="Engine Overview" width={24} height={24} unoptimized />
            ),
        },
        {
            title: "Profile Settings",
            description: "Manage your account and preferences",
            href: "/admin/profile",
            icon: (
                <Image src="https://res.cloudinary.com/destej60y/image/upload/v1774210122/setting_3_xikq8v.png" alt="Profile Settings" width={24} height={24} unoptimized />
            ),
        },
    ];

    return (
        <AdminPageShell
            user={user}
            userRole={userRole}
            title="Dashboard"
            subtitle="Admin control center"
            className="flex-1 overflow-y-auto bg-white overscroll-contain"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-36 sm:pb-10 lg:py-12">
                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl text-gray-900 font-(family-name:--font-lilita-one) leading-tight">
                        Hello, {user.name || "Admin"}
                    </h1>
                    <p className="text-gray-500 mt-2 text-base">
                        Select a section below to get started.
                    </p>
                </div>

                {/* Quick Navigation Grid */}
                <div>
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
                        Quick Navigation
                    </h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {navCards.map((card, index) => (
                            <Link
                                key={index}
                                href={card.href}
                                className="group"
                            >
                                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200 h-full flex flex-col gap-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="p-2 bg-gray-50 rounded-xl group-hover:bg-gray-100 transition-colors shrink-0">
                                                {card.icon}
                                            </div>
                                            <p className="text-lg sm:text-xl text-gray-900 font-(family-name:--font-lilita-one) leading-tight">
                                                {card.title}
                                            </p>
                                        </div>
                                        <svg
                                            className="hidden sm:block w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all shrink-0"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                    <p className="text-xs text-gray-500 leading-snug">
                                        {card.description}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </AdminPageShell>
    );
}
