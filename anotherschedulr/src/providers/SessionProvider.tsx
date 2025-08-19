"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { Session } from "next-auth";

interface SessionProviderProps {
  children: React.ReactNode;
  session?: Session | null;
}

export default function SessionProvider({ children, session }: SessionProviderProps) {
  console.log("🔍 SessionProvider rendered with session:", session);
  console.log("🔍 SessionProvider session type:", typeof session);
  console.log("🔍 SessionProvider session user:", session?.user);
  
  return (
    <NextAuthSessionProvider 
      session={session}
      refetchInterval={60} // Refetch session every minute for debugging
      refetchOnWindowFocus={true}
      refetchWhenOffline={false}
    >
      {children}
    </NextAuthSessionProvider>
  );
}