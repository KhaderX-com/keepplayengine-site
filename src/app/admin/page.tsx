import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AdminPageShell from "@/components/admin/AdminPageShell";
import Link from "next/link";
import {
    Activity,
    BarChart3,
    ChevronRight,
    DollarSign,
    ShieldCheck,
    Users,
    WalletCards,
} from "lucide-react";

interface NavCard {
    title: string;
    description: string;
    href: string;
    icon: React.ReactNode;
    accent: string;
}

interface DashboardSection {
    title: string;
    description: string;
    cards: NavCard[];
}

export default async function AdminPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        redirect("/admin/login");
    }

    const user = session.user;
    const userRole = user.role || "ADMIN";

    const sections: DashboardSection[] = [
        {
            title: "KPE",
            description: "New KeepPlay Engine infrastructure",
            cards: [
                {
                    title: "Users",
                    description: "Manage KPE accounts and user records",
                    href: "/admin/kpe/users",
                    icon: <Users className="h-5 w-5" />,
                    accent: "bg-black text-white",
                },
                {
                    title: "Ad Revenue",
                    description: "Review KPE revenue analytics",
                    href: "/admin/kpe/ad-revenue",
                    icon: <DollarSign className="h-5 w-5" />,
                    accent: "bg-emerald-100 text-emerald-700",
                },
                {
                    title: "Withdrawals",
                    description: "Process KPE payout requests",
                    href: "/admin/kpe/withdrawals",
                    icon: <WalletCards className="h-5 w-5" />,
                    accent: "bg-red-100 text-red-700",
                },
            ],
        },
        {
            title: "Earn Apps",
            description: "Earn Apps users, revenue, and payouts",
            cards: [
                {
                    title: "Users",
                    description: "Manage Earn Apps accounts",
                    href: "/admin/earn-apps/users",
                    icon: <Users className="h-5 w-5" />,
                    accent: "bg-gray-900 text-white",
                },
                {
                    title: "Ad Revenue",
                    description: "Inspect Earn Apps Axiom revenue",
                    href: "/admin/earn-apps/ad-revenue",
                    icon: <BarChart3 className="h-5 w-5" />,
                    accent: "bg-cyan-100 text-cyan-700",
                },
                {
                    title: "Withdrawals",
                    description: "Review Earn Apps withdrawal requests",
                    href: "/admin/earn-apps/withdrawals",
                    icon: <WalletCards className="h-5 w-5" />,
                    accent: "bg-amber-100 text-amber-700",
                },
            ],
        },
        {
            title: "Axiom Analytics",
            description: "Operational analytics and fraud monitoring",
            cards: [
                {
                    title: "Overview",
                    description: "Track events, sessions, revenue, and countries",
                    href: "/admin/axiom",
                    icon: <Activity className="h-5 w-5" />,
                    accent: "bg-indigo-100 text-indigo-700",
                },
                {
                    title: "Anti-Fraud",
                    description: "Investigate suspicious revenue and integrity events",
                    href: "/admin/axiom/anti-fraud",
                    icon: <ShieldCheck className="h-5 w-5" />,
                    accent: "bg-rose-100 text-rose-700",
                },
            ],
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
                <div className="mb-8">
                    <h1 className="text-3xl sm:text-4xl text-gray-900 font-(family-name:--font-lilita-one) leading-tight">
                        Hello, {user.name || "Admin"}
                    </h1>
                    <p className="text-gray-500 mt-2 text-base">Choose the platform area you want to manage.</p>
                </div>

                <div className="space-y-8">
                    {sections.map((section) => (
                        <section key={section.title} className="space-y-3">
                            <div>
                                <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                                    {section.title}
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">{section.description}</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                                {section.cards.map((card) => (
                                    <Link key={card.href} href={card.href} className="group">
                                        <div className="h-full bg-white border border-gray-100 rounded-lg p-5 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-start gap-3 min-w-0">
                                                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${card.accent}`}>
                                                        {card.icon}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xl text-gray-900 font-(family-name:--font-lilita-one) leading-tight">
                                                            {card.title}
                                                        </p>
                                                        <p className="text-sm text-gray-500 leading-snug mt-2">
                                                            {card.description}
                                                        </p>
                                                    </div>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-3" />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            </div>
        </AdminPageShell>
    );
}
