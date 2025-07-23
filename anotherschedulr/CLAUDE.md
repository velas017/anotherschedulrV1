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