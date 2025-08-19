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

  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.log("🔍 Environment Variables Check:");
    Object.entries(requiredVars).forEach(([key, value]) => {
      if (value) {
        console.log(`✅ ${key}: Set`);
      } else {
        console.error(`❌ ${key}: NOT SET`);
      }
    });
  }

  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key, _]) => key);

  if (missingVars.length > 0) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ Missing environment variables: ${missingVars.join(", ")}`);
      console.error("Please check your .env.local file and restart the server");
    }
  } else if (process.env.NODE_ENV === 'development') {
    console.log("✅ All required environment variables are set");
  }

  return missingVars.length === 0;
}

// Test database connection
async function testDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`
    if (process.env.NODE_ENV === 'development') {
      console.log("✅ Database connected successfully")
    }
  } catch (error) {
    console.error("❌ Database connection failed")
  }
}

// Run validation and tests
if (process.env.NODE_ENV === 'development') {
  validateEnvironmentVariables();
  testDatabaseConnection();
}

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
    strategy: "database", // Database sessions for Google OAuth + manual handling for credentials
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
      // Only log in development and avoid logging sensitive data
      if (process.env.NODE_ENV === 'development') {
        console.log("🔍 SignIn Callback - User:", user.email, "Provider:", account?.provider, "User ID:", user.id);
      }
      
      try {
        // For OAuth providers (specifically Google)
        if (account?.provider === "google") {
          // Processing Google OAuth sign in
          
          if (!user.email) {
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
              // Existing user found
              
              // Check if this Google account is already linked
              const existingGoogleAccount = existingUser.accounts.find(
                acc => acc.provider === "google"
              );
              
              if (existingGoogleAccount) {
                // Google account already linked
                // Just update the profile data
                await tx.user.update({
                  where: { id: existingUser.id },
                  data: {
                    name: profile?.name || user.name || existingUser.name,
                    image: profile?.picture || user.image || existingUser.image,
                  },
                });
              } else {
                // User exists but no Google account linked yet
                // This handles the case where user exists (maybe from email/password)
                // but is now linking their Google account
              }
              
              return { success: true, userId: existingUser.id };
            } else {
              // New Google user, will be created by adapter
              return { success: true, userId: null };
            }
          });
          
          return result.success;
        }
        
        // For credentials provider - manual session creation since PrismaAdapter doesn't handle this
        if (account?.provider === "credentials") {
          if (process.env.NODE_ENV === 'development') {
            console.log("User signed in - Provider: credentials");
            console.log("🔧 Creating manual database session for credentials provider");
          }
          
          // Create session record manually since PrismaAdapter doesn't handle credentials
          try {
            const sessionToken = crypto.randomUUID();
            const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
            
            // Create session record that PrismaAdapter would normally create
            await prisma.session.create({
              data: {
                sessionToken,
                userId: user.id,
                expires,
              }
            });
            
            if (process.env.NODE_ENV === 'development') {
              console.log("✅ Manual session created for credentials user:", user.id);
            }
            
            return true;
          } catch (error) {
            console.error("❌ Failed to create manual session for credentials:", error);
            return false;
          }
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log("⚠️ Unknown provider:", account?.provider);
        }
        return true;
        
      } catch (error: any) {
        console.error("❌ SignIn callback error");
        
        // Monitor for duplicate account attempts
        if (error.code === 'P2002' && error.meta?.target?.includes('userId_provider')) {
          // DUPLICATE ACCOUNT ATTEMPT DETECTED
          // Log to monitoring service in production
          console.error("Security: Duplicate account attempt detected");
        }
        
        return false; // Block sign in on errors to see what's failing
      }
    },
    
    async session({ session, user, token }) {
      if (process.env.NODE_ENV === 'development') {
        console.log("🔍 Session Callback - Session User ID:", session?.user?.id, "DB User ID:", user?.id, "Token ID:", token?.sub);
      }
      
      try {
        // For database sessions, user should be provided by PrismaAdapter (for Google OAuth)
        if (session.user && user) {
          session.user.id = user.id;
          if (process.env.NODE_ENV === 'development') {
            console.log("✅ Session user ID set from database user:", user.id);
          }
        } 
        // Fallback: If no database user but we have a token (credentials provider fallback)
        else if (session.user && token?.sub) {
          session.user.id = token.sub;
          if (process.env.NODE_ENV === 'development') {
            console.log("✅ Session user ID set from token fallback:", token.sub);
          }
        } 
        else {
          if (process.env.NODE_ENV === 'development') {
            console.error("❌ Missing session data - Session:", !!session.user, "User:", !!user, "Token:", !!token?.sub);
          }
        }
        
        return session;
      } catch (error) {
        console.error("❌ Session callback error:", error);
        return session;
      }
    },
    
    async jwt({ token, user, account }) {
      if (process.env.NODE_ENV === 'development') {
        console.log("🔍 JWT Callback - Token ID:", token.sub, "User ID:", user?.id, "Provider:", account?.provider);
      }
      
      // For database sessions, JWT callback is mainly for credentials provider
      if (user?.id) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        
        if (process.env.NODE_ENV === 'development') {
          console.log("✅ JWT token updated with user info:", user.id);
        }
      }
      
      return token;
    },
    
    async redirect({ url, baseUrl }) {
      if (process.env.NODE_ENV === 'development') {
        console.log("🔍 Redirect - URL:", url, "Base URL:", baseUrl);
      }
      
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
  debug: false, // Set to true only for debugging specific issues
  // Remove verbose event logging in production
  events: process.env.NODE_ENV === 'development' ? {
    async signIn({ user, account, profile, isNewUser }) {
      console.log("User signed in - Provider:", account?.provider);
    },
    async createUser({ user }) {
      console.log("New user created");
    },
    async linkAccount({ user, account, profile }) {
      console.log("Account linked - Provider:", account.provider);
    },
  } : {},
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }