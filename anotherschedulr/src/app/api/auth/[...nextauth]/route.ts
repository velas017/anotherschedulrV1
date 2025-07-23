import { NextAuthOptions } from "next-auth"
import NextAuth from "next-auth/next"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"
import { Adapter } from "next-auth/adapters"
import { prisma } from '@/lib/prisma'

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
          response_type: "code"
        }
      }
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
      },
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("🔍 SignIn Callback:");
      console.log("  - User:", user);
      console.log("  - Account:", account);
      console.log("  - Profile:", profile);
      
      // For OAuth providers, ensure we have the basic user info
      if (account?.provider === "google" && profile) {
        // Update user with Google profile data if needed
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              name: profile.name || user.name,
              image: profile.picture || profile.image || user.image,
            },
          });
        } catch (error) {
          console.error("Failed to update user profile:", error);
        }
      }
      
      return true;
    },
    async session({ session, user }) {
      console.log("🔍 Session Callback:");
      console.log("  - Session:", session);
      console.log("  - User:", user);
      
      if (session.user) {
        session.user.id = user.id;
      }
      
      console.log("🔍 Updated Session:", session);
      return session;
    },
    async redirect({ url, baseUrl }) {
      console.log("🔍 Redirect Callback:");
      console.log("  - URL:", url);
      console.log("  - Base URL:", baseUrl);
      
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
  pages: {
    signIn: "/signin",
    signUp: "/signup",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
  events: {
    async signIn({ user, account, profile }) {
      console.log("🎉 User signed in:", user.email);
    },
    async signOut({ session, token }) {
      console.log("👋 User signed out");
    },
    async createUser({ user }) {
      console.log("🆕 New user created:", user.email);
    },
    async linkAccount({ user, account, profile }) {
      console.log("🔗 Account linked:", account.provider, "for user:", user.email);
    },
    async session({ session, token }) {
      console.log("📊 Session accessed");
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }