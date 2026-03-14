"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { Session } from "next-auth";

export default function SessionProvider({
    children,
    session,
}: {
    children: React.ReactNode;
    session: Session | null;
}) {
    return (
        <NextAuthSessionProvider
            session={session}
            // M01: Re-validate session every 5 minutes to detect idle/expired sessions
            refetchInterval={5 * 60}
            refetchOnWindowFocus={true}
        >
            {children}
        </NextAuthSessionProvider>
    );
}
