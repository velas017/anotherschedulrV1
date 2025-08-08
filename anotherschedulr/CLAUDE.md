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

## 🔴 CRITICAL: Session Management & Documentation

**MANDATORY ACTIONS FOR EVERY SESSION:**

### Start of Session
1. **ALWAYS** read `PROJECT_STATUS.md` first to understand:
   - Current project state and phase
   - Last session's work
   - Active sprint items
   - Known issues and blockers
   - Next steps identified

2. Review any specific area mentioned in the "Next Steps" section

### During Session
1. Keep `PROJECT_STATUS.md` in mind for context
2. Update the todo list frequently as you work
3. Document any significant decisions or changes

### End of Session
1. **ALWAYS** update `PROJECT_STATUS.md` with:
   - Date and summary of work completed
   - Any new issues discovered
   - Next steps for the following session
   - Updates to the Recent Changes Log
   - Feature status updates (completed/in-progress)

2. Use the update template provided at the bottom of PROJECT_STATUS.md

### Quick Reference
- **Project Status**: `PROJECT_STATUS.md` - Current state, architecture, progress
- **Technical Guidance**: `CLAUDE.md` - Development standards and requirements
- **Component Docs**: `COMPONENT_ARCHITECTURE.md` - Component details
- **Security**: `SECURITY.md` - Security requirements and audit results

## Development Guidelines

### Database Integration

**CRITICAL**: Always use the correct Prisma import pattern to avoid runtime errors.

#### ✅ Correct Pattern
```typescript
import { prisma } from '@/lib/prisma';  // Named import - REQUIRED
```

#### ❌ Common Mistake
```typescript
import prisma from '@/lib/prisma';     // Default import - WILL FAIL
```

**Why**: The prisma client is exported as a named export (`export const prisma = ...`) from `/src/lib/prisma.ts`, so it must be imported using destructuring syntax.

### API Route Standards

All API routes must follow this pattern for database operations:

```typescript
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';  // ✅ Correct import

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Standard session validation
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use session.user.id directly for tenant isolation
    const data = await prisma.yourModel.findMany({
      where: { userId: session.user.id },  // ✅ Direct use of session.user.id
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

#### Key Points:
- **Import**: Use `{ prisma }` named import, never default import
- **Session**: Use `session?.user?.id` directly, no database lookup needed
- **Tenant Isolation**: Always filter by `userId: session.user.id`
- **Error Handling**: Log errors and return appropriate HTTP status codes

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

## Microservices Architecture Requirements

**CRITICAL**: This application must be designed to scale into a distributed microservices architecture. All new features and components should consider future service decomposition.

### Service Decomposition Strategy
- **User Management Service**: Authentication, user profiles, business settings
- **Appointment Scheduling Service**: Calendar management, booking logic, availability
- **Client Management Service**: Client data, communication preferences, history
- **Service Catalog Service**: Service definitions, pricing, categories
- **Notification Service**: Email, SMS, push notifications, templates
- **Payment Processing Service**: Billing, invoicing, payment methods
- **Analytics Service**: Reporting, metrics, business intelligence
- **Public API Gateway**: Rate limiting, authentication, request routing

### Service Design Principles
- **Domain-Driven Design**: Each service owns a specific business domain
- **Database Per Service**: No shared databases between services
- **API-First**: All services expose well-defined REST/GraphQL APIs
- **Event-Driven**: Asynchronous communication via message queues
- **Stateless**: Services should not maintain session state
- **Fault Tolerant**: Circuit breakers, retries, graceful degradation

### Inter-Service Communication
- **Synchronous**: REST APIs for immediate consistency requirements
- **Asynchronous**: Event streaming (Redis Streams/Apache Kafka) for eventual consistency
- **Service Mesh**: Consider Istio/Linkerd for production deployments
- **API Gateway**: Centralized routing, authentication, rate limiting
- **Message Queues**: Redis/RabbitMQ for reliable event delivery

### Data Consistency Patterns
- **Saga Pattern**: Distributed transactions across services
- **Event Sourcing**: Append-only event logs for audit trails
- **CQRS**: Separate read/write models for performance
- **Eventual Consistency**: Accept temporary inconsistency for availability

## Database Partitioning & Scaling Requirements

**CRITICAL**: The database architecture must support horizontal scaling through partitioning strategies that maintain tenant isolation.

### Horizontal Partitioning (Sharding)
- **Shard Key**: Primary partitioning by `userId` (tenant ID)
- **Partition Strategy**: Range-based or hash-based distribution
- **Shard Count**: Plan for 100+ shards to support millions of users
- **Rebalancing**: Automatic shard splitting and migration capabilities
- **Cross-Shard Queries**: Minimize and optimize for federation
- **Routing Layer**: Application-level shard routing with fallback

### Vertical Partitioning
- **Read/Write Separation**: Dedicated read replicas for analytics
- **Hot/Cold Storage**: Frequently accessed vs archival data separation
- **Service-Specific Stores**: Each microservice owns its data store
- **OLTP/OLAP Separation**: Transactional vs analytical workloads

### Database Technologies per Service
- **User Management**: PostgreSQL with row-level security (RLS)
- **Appointment Scheduling**: PostgreSQL with time-series optimizations
- **Analytics**: ClickHouse or BigQuery for analytical queries
- **Caching**: Redis for session data and frequently accessed content
- **Search**: Elasticsearch for full-text search capabilities
- **File Storage**: S3/MinIO for documents and media

### Partition-Aware Development
- **Tenant Routing**: All queries must include tenant context
- **Connection Pooling**: Per-shard connection management
- **Migration Strategy**: Zero-downtime schema changes across shards
- **Backup/Recovery**: Shard-level backup and restore procedures
- **Monitoring**: Per-shard performance and health metrics

## Scaling & Performance Requirements

**CRITICAL**: The application must meet these performance benchmarks and scaling targets.

### Performance Targets
- **Concurrent Users**: Support 10,000+ simultaneous active users
- **API Response Time**: 95th percentile under 200ms for all endpoints
- **Database Queries**: 99th percentile under 50ms for OLTP operations
- **Uptime SLA**: 99.9% availability (8.76 hours downtime/year max)
- **Throughput**: Handle 100,000+ API requests per minute at peak

### Auto-Scaling Requirements
- **Horizontal Pod Autoscaling**: CPU/memory-based scaling
- **Database Read Replicas**: Auto-scaling read capacity
- **CDN Integration**: Global content delivery for static assets
- **Load Balancing**: Multi-zone traffic distribution
- **Circuit Breakers**: Automatic failover and recovery

### Monitoring & Observability
- **Distributed Tracing**: OpenTelemetry across all services
- **Centralized Logging**: Structured logs with correlation IDs
- **Metrics Collection**: Prometheus/Grafana for system metrics
- **APM Integration**: Application performance monitoring
- **Alert Management**: PagerDuty/OpsGenie for incident response
- **Multi-Tenant Metrics**: Isolated metrics per tenant for SLA monitoring

### Caching Strategy
- **Application Cache**: Redis for session and frequently accessed data
- **CDN Caching**: CloudFlare/AWS CloudFront for static content
- **Database Query Cache**: Redis for expensive query results
- **API Gateway Cache**: Response caching for read-heavy endpoints

## Accessibility Requirements: WCAG 2.2 Compliance

**CRITICAL**: This application must meet WCAG 2.2 Level AA accessibility guidelines. All new components and features must follow these standards:

### Semantic HTML & Structure
- Use proper HTML5 semantic elements (`<main>`, `<nav>`, `<section>`, `<header>`, etc.)
- Maintain logical heading hierarchy (h1 → h2 → h3)
- Use lists (`<ul>`, `<ol>`) for grouped content
- Ensure proper form labeling with `<label>` elements

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Implement proper focus management and visible focus indicators
- Support tab navigation with logical tab order
- Provide skip links for main content areas
- Handle modal/panel focus trapping

### ARIA Attributes
- Use appropriate ARIA roles, states, and properties
- Implement `aria-label`, `aria-labelledby`, and `aria-describedby` where needed
- Use `aria-expanded`, `aria-selected` for interactive components
- Provide live regions (`aria-live`) for dynamic content updates

### Color & Contrast
- Maintain minimum 4.5:1 contrast ratio for normal text
- Maintain minimum 3:1 contrast ratio for large text and UI components
- Never rely solely on color to convey information
- Support both light and dark themes with proper contrast

### Responsive Design
- Support zoom up to 400% without horizontal scrolling
- Ensure touch targets are minimum 44×44 pixels
- Design works across mobile, tablet, and desktop
- Support both portrait and landscape orientations

### Component-Specific Guidelines
- **Forms**: Proper labels, error messages, and validation feedback
- **Modals/Panels**: Focus trapping, escape key handling, return focus
- **Calendars**: Keyboard navigation, proper date announcements
- **Tables**: Header associations, sorting announcements
- **Buttons**: Clear purpose, loading states, disabled states

### Testing Requirements
- Test with screen readers (VoiceOver, NVDA, JAWS)
- Verify keyboard-only navigation
- Check color contrast ratios
- Validate with automated tools (axe-core, Lighthouse)

## Mobile Responsive Architecture Requirements

**CRITICAL**: This application must provide an excellent mobile experience across all devices and screen sizes with a mobile-first approach.

### Mobile-First Design Strategy
- **Primary Focus**: Mobile devices (320px - 768px) are the primary target
- **Progressive Enhancement**: Desktop features built on top of mobile foundation
- **Breakpoints**: 
  - Mobile: 320px - 768px (smartphones, primary development target)
  - Tablet: 768px - 1024px (tablets, secondary optimization)
  - Desktop: 1024px+ (desktops, enhanced experience)
- **Design Philosophy**: If it works great on mobile, it will work everywhere

### Touch Interface Requirements
- **Touch Targets**: Minimum 44×44px tap targets with 8px spacing between interactive elements
- **Gesture Support**: 
  - Swipe navigation for calendar views
  - Pull-to-refresh on data pages
  - Pinch-to-zoom where appropriate (calendar, images)
  - Long-press for context menus
- **Touch Feedback**: Visual feedback for all touch interactions (hover states, active states)
- **Orientation Support**: Full functionality in both portrait and landscape modes

### Mobile Performance Requirements
- **Initial Load**: Under 3 seconds on 3G networks (Fast 3G: 1.6Mbps/750kbps)
- **Bundle Size**: 
  - JavaScript bundles under 200KB compressed per route
  - CSS under 50KB compressed
  - Critical path resources under 14KB (first TCP round trip)
- **Image Optimization**: 
  - WebP format with JPEG fallback
  - Responsive image sizing with srcset
  - Lazy loading for non-critical images
- **Resource Hints**: Preload critical resources, prefetch likely next pages

### Mobile Calendar Requirements
- **Calendar Views**:
  - Mobile: Single-day view as primary, week view as horizontal scroll
  - Tablet: Week view optimized for touch
  - Desktop: Week/month views with full functionality
- **Touch Interactions**:
  - Tap empty time slot to create appointment
  - Tap appointment to view/edit details
  - Drag appointments to reschedule (with haptic feedback where available)
  - Swipe between days/weeks
- **Appointment Display**:
  - Larger text on mobile for readability
  - Essential information priority (client name, time, service)
  - Expandable details for additional information
- **Navigation**: Sticky date picker, easy month/week switching

### Responsive Component Architecture
- **Navigation**: 
  - Mobile: Collapsible hamburger menu with slide-out drawer
  - Tablet: Collapsible sidebar
  - Desktop: Full sidebar navigation
- **Forms**: 
  - Mobile: Single-column layout, larger input fields, appropriate input types
  - Tablet/Desktop: Multi-column where appropriate
- **Data Tables**: 
  - Mobile: Card layout or horizontal scroll with sticky columns
  - Tablet/Desktop: Full table layout
- **Modals**: 
  - Mobile: Full-screen overlays
  - Tablet/Desktop: Centered modals with backdrop

### Mobile Development Standards
- **Viewport Meta Tag**: Properly configured for responsive design
- **CSS Approach**: Mobile-first media queries with min-width breakpoints
- **JavaScript**: Touch event handling with mouse fallbacks
- **Testing**: Real device testing required, not just browser dev tools
- **Performance Budget**: Monitor and enforce mobile performance metrics

### Cross-Platform Compatibility
- **iOS Safari**: Primary mobile browser target
- **Chrome Mobile**: Android primary target  
- **Samsung Internet**: Android secondary target
- **Edge Mobile**: Windows phone support where applicable
- **PWA Support**: Progressive Web App capabilities for native-like experience

### Mobile UX Patterns
- **Loading States**: Skeleton screens for better perceived performance
- **Offline Support**: Basic functionality without network connection
- **Error Handling**: Mobile-friendly error messages and retry mechanisms
- **Content Hierarchy**: Information prioritization for small screens
- **Typography**: Readable font sizes (minimum 16px to prevent zoom)

### Mobile Testing Requirements
- **Device Testing**: Test on real devices across iOS and Android
- **Network Testing**: Test on slow connections (Slow 3G, offline)
- **Orientation Testing**: Verify functionality in both orientations
- **Touch Testing**: Verify all touch interactions work properly
- **Performance Testing**: Lighthouse mobile scores, real device metrics

### Development Priorities for Mobile
- **Core Functionality First**: Essential features work perfectly on mobile
- **Performance**: Every feature decision considers mobile performance impact
- **Accessibility**: Touch accessibility, screen reader compatibility
- **Battery Usage**: Efficient code to preserve device battery life
- **Data Usage**: Minimize data consumption for users with limited plans

## Development Notes

### Current Development Environment
- No test framework is currently set up
- Authentication setup details are in `SETUP.md`
- Use `npx prisma generate` after any schema changes
- Protected routes require session - check with `useSession()` hook
- API routes use standard Next.js Request/Response objects

### Microservices Development Considerations
- **Service Boundaries**: Design new features with future service extraction in mind
- **API Design**: Create well-defined interfaces that can become service contracts
- **Data Modeling**: Avoid cross-domain dependencies in database schemas
- **Local Development**: Consider Docker Compose for multi-service development
- **Testing Strategy**: Plan for contract testing between services
- **Service Versioning**: Implement backward-compatible API changes

### Database Partitioning Development Guidelines
- **Query Patterns**: Always include tenant context in database queries
- **Connection Management**: Implement connection pooling per shard
- **Schema Migrations**: Design migrations to work across multiple shards
- **Performance Testing**: Test queries against partitioned data sets
- **Monitoring**: Implement per-shard performance tracking
- **Backup Strategy**: Ensure consistent backups across partitions

### Development Priorities (ALWAYS VERIFY)
- **Tenant Isolation**: All new features must maintain strict tenant boundaries
- **Accessibility Compliance**: Test WCAG 2.2 Level AA compliance before implementation
- **Performance Impact**: Consider scaling implications of new features
- **Service Readiness**: Design for future microservices decomposition
- **Database Efficiency**: Optimize for partition-aware query patterns

## Outstanding Technical Tasks

Based on comprehensive code review conducted 2025-01-23:

### Completed Tasks ✅
- **Critical Security Fix**: Fixed service category deletion vulnerability (missing userId filter in updateMany operation)
- **Database Connection Pooling**: Implemented singleton PrismaClient pattern in `/src/lib/prisma.ts` to prevent connection exhaustion

### High Priority Tasks 🔴
1. **Add missing database indexes for tenant-scoped queries**
   - Add composite indexes on (userId, otherFields) for all tenant-scoped tables
   - Improves query performance for multi-tenant architecture
   
2. **Fix modal focus trapping and ARIA attributes for accessibility**
   - Implement proper focus management in modals and panels
   - Add missing ARIA attributes for screen reader support
   - Ensure WCAG 2.2 Level AA compliance

### Medium Priority Tasks 🟡
3. **Associate form error messages with fields using aria-describedby**
   - Link validation errors to form fields for accessibility
   - Improve screen reader experience

4. **Optimize N+1 queries in public services API endpoint**
   - Review `/src/app/api/public/[userId]/services/route.ts` for query optimization
   - Consider using fewer database round trips

5. **Add rate limiting to API endpoints**
   - Implement rate limiting middleware to prevent abuse
   - Protect against DDoS and ensure fair usage

6. **Plan PostgreSQL migration from SQLite**
   - Design migration strategy for production database
   - Test partitioning and scaling with PostgreSQL

### Notes
- All database-related tasks should consider the multi-tenant architecture requirements
- Accessibility fixes are critical for compliance and should be prioritized
- Performance optimizations align with scaling requirements outlined in this document