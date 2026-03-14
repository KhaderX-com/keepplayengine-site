import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NotificationsDAL, getUserClient } from "@/lib/dal";
import NotificationsClient from "@/components/admin/NotificationsClient";

export const metadata = {
    title: "Notifications | Admin Panel",
    description: "Manage your notifications and messages",
};

export default async function NotificationsPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/admin/login");
    }

    const user = session.user as { id: string; email: string; name?: string | null; role?: string; image?: string | null };
    const client = await getUserClient(user.id, user.role ?? "ADMIN");

    // Fetch initial notifications and unread count server-side
    const [notificationsResult, unreadResult] = await Promise.all([
        NotificationsDAL.list(client, user.id, { limit: 50 }),
        NotificationsDAL.getUnreadCount(client, user.id),
    ]);

    const notifications = notificationsResult.data ?? [];
    const unreadCount = unreadResult.count ?? 0;

    return (
        <NotificationsClient
            initialNotifications={notifications}
            initialUnreadCount={unreadCount}
            user={user}
            userRole={user.role}
        />
    );
}
