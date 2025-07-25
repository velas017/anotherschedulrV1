import { NextAuthOptions } from "next-auth"
import NextAuth from "next-auth/next"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"
import { Adapter } from "next-auth/adapters"
import { prisma } from '@/lib/prisma'
import crypto from "crypto"

// Validate environment variables
function validateEnvironmentVariables() {
  const requiredVars = {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  };

  console.log("🔍 Environment Variables Check:");
  Object.entries(requiredVars).forEach(([key, value]) => {
    if (value) {
      console.log(`✅ ${key}: Set`);
    } else {
      console.error(`❌ ${key}: NOT SET`);
    }
  });

  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key, _]) => key);

  if (missingVars.length > 0) {
    console.error(`❌ Missing environment variables: ${missingVars.join(", ")}`);
    console.error("Please check your .env.local file and restart the server");
  } else {
    console.log("✅ All required environment variables are set");
  }

  return missingVars.length === 0;
}

// Test database connection
async function testDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`
    console.log("✅ Database connected successfully")
  } catch (error) {
    console.error("❌ Database connection failed:", error)
  }
}

// Run validation and tests
validateEnvironmentVariables();
testDatabaseConnection();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile"
        }
      },
      httpOptions: {
        timeout: 40000,
      },
      profile(profile) {
        console.log("🔍 Google Profile Data:", profile);
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        }
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "john@example.com",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        })

        if (!user || !user.password) {
          return null
        }

        const passwordsMatch = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!passwordsMatch) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain: undefined,
      },
    },
    callbackUrl: {
      name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: `${process.env.NODE_ENV === "production" ? "__Host-" : ""}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("🔍 SignIn Callback START:");
      console.log("  - User:", JSON.stringify(user, null, 2));
      console.log("  - Account:", JSON.stringify(account, null, 2));
      console.log("  - Profile:", JSON.stringify(profile, null, 2));
      
      try {
        // For OAuth providers (specifically Google)
        if (account?.provider === "google") {
          console.log("✅ Processing Google OAuth sign in");
          
          if (!user.email) {
            console.error("❌ No email provided by Google");
            return false;
          }
          
          // Use a transaction to prevent race conditions
          const result = await prisma.$transaction(async (tx) => {
            // Check if user already exists in database
            const existingUser = await tx.user.findUnique({
              where: { email: user.email! },
              include: { accounts: true }
            });
            
            if (existingUser) {
              console.log("✅ Existing user found:", existingUser.email);
              
              // Check if this Google account is already linked
              const existingGoogleAccount = existingUser.accounts.find(
                acc => acc.provider === "google"
              );
              
              if (existingGoogleAccount) {
                console.log("✅ Google account already linked for user");
                // Just update the profile data
                await tx.user.update({
                  where: { id: existingUser.id },
                  data: {
                    name: profile?.name || user.name || existingUser.name,
                    image: profile?.picture || user.image || existingUser.image,
                  },
                });
              } else {
                console.log("⚠️ User exists but no Google account linked yet");
                // This handles the case where user exists (maybe from email/password)
                // but is now linking their Google account
              }
              
              return { success: true, userId: existingUser.id };
            } else {
              console.log("✅ New Google user, will be created by adapter");
              return { success: true, userId: null };
            }
          });
          
          console.log("✅ SignIn callback returning:", result.success);
          return result.success;
        }
        
        // For credentials provider
        if (account?.provider === "credentials") {
          console.log("✅ Credentials sign in successful");
          return true;
        }
        
        console.log("⚠️ Unknown provider:", account?.provider);
        return true;
        
      } catch (error: any) {
        console.error("❌ SignIn callback error:", error);
        console.error("❌ Error stack:", error.stack);
        
        // Monitor for duplicate account attempts
        if (error.code === 'P2002' && error.meta?.target?.includes('userId_provider')) {
          console.error("🚨 DUPLICATE ACCOUNT ATTEMPT DETECTED!");
          console.error("🚨 User tried to link multiple accounts from same provider");
          console.error("🚨 This should be prevented by our unique constraint");
          // You could send this to your monitoring service here
        }
        
        return false; // Block sign in on errors to see what's failing
      }
    },
    
    async session({ session, user, token }) {
      console.log("🔍 Session Callback START:");
      console.log("  - Session:", JSON.stringify(session, null, 2));
      console.log("  - Database user:", JSON.stringify(user, null, 2));
      console.log("  - Token:", JSON.stringify(token, null, 2));
      
      try {
        // Ensure session has user ID from database
        if (session.user && user) {
          session.user.id = user.id;
          console.log("✅ Session updated with user ID:", user.id);
        } else {
          console.error("❌ Missing session.user or database user:", { 
            hasSessionUser: !!session.user, 
            hasDbUser: !!user 
          });
        }
        
        console.log("✅ Session callback returning:", JSON.stringify(session, null, 2));
        return session;
      } catch (error) {
        console.error("❌ Session callback error:", error);
        return session;
      }
    },
    
    async redirect({ url, baseUrl }) {
      console.log("🔍 Redirect Callback:");
      console.log("  - URL:", url);
      console.log("  - Base URL:", baseUrl);
      
      // Allows relative callback URLs
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      
      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      
      // Default to base URL for security
      return baseUrl;
    },
  },
  pages: {
    signIn: "/signin",
    signUp: "/signup",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log("🎉 User signed in:");
      console.log("  - Email:", user.email);
      console.log("  - Provider:", account?.provider);
      console.log("  - Is new user:", isNewUser);
      console.log("  - User ID:", user.id);
    },
    async signOut({ session, token }) {
      console.log("👋 User signed out:");
      if (session?.user?.email) {
        console.log("  - Email:", session.user.email);
      }
    },
    async createUser({ user }) {
      console.log("🆕 New user created:");
      console.log("  - Email:", user.email);
      console.log("  - ID:", user.id);
      console.log("  - Name:", user.name);
    },
    async linkAccount({ user, account, profile }) {
      console.log("🔗 Account linked:");
      console.log("  - Provider:", account.provider);
      console.log("  - User email:", user.email);
      console.log("  - Provider account ID:", account.providerAccountId);
    },
    async session({ session, token }) {
      console.log("📊 Session accessed:");
      console.log("  - User email:", session?.user?.email);
      console.log("  - Session expires:", session?.expires);
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }