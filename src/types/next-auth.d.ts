import "next-auth";
import { AdminRoleType } from "@/lib/supabase";

declare module "next-auth" {
    interface User {
        id: string;
        role: AdminRoleType;
    }

    interface Session {
        user: {
            id: string;
            role: AdminRoleType;
            name?: string | null;
            email?: string | null;
            image?: string | null;
        };
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role: AdminRoleType;
    }
}
