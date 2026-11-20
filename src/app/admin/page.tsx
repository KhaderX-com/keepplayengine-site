import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AdminPageShell from "@/components/admin/AdminPageShell";
import Link from "next/link";
import { ClipboardList, Flag, ScrollText, ChevronRight } from "lucide-react";

export default async function AdminPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/admin/login");

    const user = session.user;
    const links = [
        { title: "Task Board", description: "Organise and track your team's work.", href: "/admin/tasks", icon: ClipboardList },
        { title: "Milestones", description: "Review milestones and project progress.", href: "/admin/milestones", icon: Flag },
        { title: "Audit Logs", description: "Review admin activity and active sessions.", href: "/admin/dashboard?tab=audit", icon: ScrollText },
    ];

    return (
        <AdminPageShell user={user} userRole={user.role || "ADMIN"} title="Dashboard" subtitle="Admin control center" className="flex-1 overflow-y-auto bg-white overscroll-contain">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-36 sm:pb-10 lg:py-12">
                <div className="mb-8">
                    <h1 className="text-3xl sm:text-4xl text-gray-900 font-(family-name:--font-lilita-one) leading-tight">Hello, {user.name || "Admin"}</h1>
                    <p className="text-gray-500 mt-2 text-base">Manage your tasks and review admin activity.</p>
                </div>
                <section aria-labelledby="quick-links">
                    <h2 id="quick-links" className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Quick links</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                        {links.map(({ title, description, href, icon: Icon }) => (
                            <Link key={href} href={href} className="group flex items-start justify-between gap-4 bg-white border border-gray-100 rounded-lg p-5 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200">
                                <div className="flex items-start gap-3 min-w-0">
                                    <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 bg-gray-900 text-white"><Icon className="h-5 w-5" /></div>
                                    <div><h3 className="text-xl text-gray-900 font-(family-name:--font-lilita-one) leading-tight">{title}</h3><p className="text-sm text-gray-500 leading-snug mt-2">{description}</p></div>
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-3" />
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </AdminPageShell>
    );
}
