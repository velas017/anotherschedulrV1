# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev          # Start Next.js dev server (http://localhost:3000)
npm run build        # Build for production
npm run start        # Run production server
npm run lint         # Run ESLint
```

### Database
```bash
npx prisma generate     # Generate Prisma Client after schema changes
npx prisma migrate dev  # Create and apply migrations
npx prisma studio       # Open database GUI
npx prisma db push      # Push schema changes without migration (dev only)
```

## Architecture

This is a Next.js 15 application using App Router with the following stack:
- **Frontend**: React 19, TypeScript, Tailwind CSS v4
- **Auth**: NextAuth.js with database sessions (email/password + Google OAuth)
- **Database**: Prisma ORM with SQLite (dev) / PostgreSQL (prod)
- **API**: Next.js API routes in `app/api/`

### Key Directories
- `src/app/` - Pages and API routes (App Router)
- `src/components/` - Reusable React components
- `src/providers/` - Context providers (SessionProvider)
- `prisma/` - Database schema and migrations

### Authentication Flow
1. NextAuth configured in `app/api/auth/[...nextauth]/route.ts`
2. Middleware in `src/middleware.ts` protects `/dashboard/*` routes
3. Session provider wraps the app in `app/layout.tsx`
4. Custom registration endpoint at `app/api/register/route.ts`

### Database Schema
Main entities: User, Client, Service, Appointment (see `prisma/schema.prisma`)

### Environment Variables
Required in `.env.local`:
- `DATABASE_URL` - SQLite or PostgreSQL connection
- `NEXTAUTH_SECRET` - Session encryption key
- `NEXTAUTH_URL` - App URL (http://localhost:3000 in dev)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - For OAuth

## Critical Architecture Requirement: Tenant Isolation

**IMPORTANT**: This application requires multi-tenant architecture with strict tenant isolation. Each user (business owner) must have completely isolated data from other users. Key considerations:

- All database queries MUST filter by the authenticated user's ID
- Never expose data across tenant boundaries
- Each user owns their own set of clients, services, and appointments
- Future scaling will require handling large amounts of isolated tenant data
- Consider row-level security (RLS) when migrating to PostgreSQL
- All API endpoints must verify tenant ownership before data access

### Current Implementation
- User model acts as the tenant root
- Relations: User -> Clients, Services, Appointments
- All queries should include `where: { userId: session.user.id }`

## Development Notes

- No test framework is currently set up
- Authentication setup details are in `SETUP.md`
- Use `npx prisma generate` after any schema changes
- Protected routes require session - check with `useSession()` hook
- API routes use standard Next.js Request/Response objects
- ALWAYS verify tenant isolation in new features