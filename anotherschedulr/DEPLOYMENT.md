# Production Deployment Guide

This comprehensive guide covers deploying your Next.js scheduling application to production, handling real users, and scaling your infrastructure.

## Table of Contents
1. [Deployment Strategy Overview](#deployment-strategy-overview)
2. [Quick Deploy (Vercel)](#quick-deploy-vercel)
3. [Production Deploy (Railway)](#production-deploy-railway)
4. [Enterprise Deploy (AWS)](#enterprise-deploy-aws)
5. [Database Migration](#database-migration)
6. [Environment Configuration](#environment-configuration)
7. [Domain & SSL Setup](#domain--ssl-setup)
8. [CI/CD Pipeline](#cicd-pipeline)
9. [Monitoring & Analytics](#monitoring--analytics)
10. [Security Best Practices](#security-best-practices)
11. [Performance Optimization](#performance-optimization)
12. [Scaling Strategies](#scaling-strategies)
13. [Maintenance & Updates](#maintenance--updates)

## Deployment Strategy Overview

### Deployment Phases

| Phase | Platform | Database | Users | Cost | Complexity |
|-------|----------|----------|-------|------|------------|
| **MVP** | Vercel | Neon/PlanetScale | 1-100 | $0-20/month | Low |
| **Growth** | Railway/Render | PostgreSQL | 100-10K | $50-200/month | Medium |
| **Scale** | AWS/GCP | RDS/Cloud SQL | 10K+ | $200+/month | High |

### Platform Comparison

#### Vercel
- ✅ **Pros**: Zero-config, automatic deployments, CDN included
- ❌ **Cons**: Cold starts, limited database options, expensive at scale
- 🎯 **Best for**: MVP launch, quick prototyping

#### Railway
- ✅ **Pros**: PostgreSQL included, simple setup, good pricing
- ❌ **Cons**: Smaller ecosystem, fewer regions
- 🎯 **Best for**: Production apps with moderate traffic

#### AWS
- ✅ **Pros**: Full control, unlimited scaling, enterprise features
- ❌ **Cons**: Complex setup, requires DevOps knowledge
- 🎯 **Best for**: High-scale, enterprise applications

## Quick Deploy (Vercel)

Perfect for MVP launch and getting your app online quickly.

### 1. Database Setup (Neon PostgreSQL)

```bash
# Sign up at neon.tech and create a database
# Copy the connection string
```

### 2. Environment Variables

Create these environment variables in Vercel dashboard:

```env
# Database
DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"

# NextAuth
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="your-generated-secret-32-chars-long"

# Google OAuth (production credentials)
GOOGLE_CLIENT_ID="your-production-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-production-client-secret"
```

### 3. Deploy Steps

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy
vercel

# 4. Run database migrations
npx prisma migrate deploy
npx prisma generate
```

### 4. Custom Domain Setup

```bash
# Add your domain in Vercel dashboard
# Update NEXTAUTH_URL to your custom domain
NEXTAUTH_URL="https://yourdomain.com"
```

### 5. Google OAuth Production Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized domains:
   - `https://yourdomain.com`
   - `https://yourdomain.com/api/auth/callback/google`

## Production Deploy (Railway)

Recommended for production applications with real users.

### 1. Railway Setup

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Create new project
railway new

# 4. Add PostgreSQL
railway add postgresql
```

### 2. Environment Configuration

```bash
# Get database URL
railway variables

# Set environment variables
railway variables set NEXTAUTH_URL=https://your-app.railway.app
railway variables set NEXTAUTH_SECRET=your-32-char-secret
railway variables set GOOGLE_CLIENT_ID=your-client-id
railway variables set GOOGLE_CLIENT_SECRET=your-client-secret
```

### 3. Database Migration

```bash
# 1. Update schema for production
# Edit prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

# 2. Generate migration
npx prisma migrate dev --name production_init

# 3. Deploy to Railway
railway up

# 4. Run migrations in production
railway run npx prisma migrate deploy
railway run npx prisma generate
```

### 4. Custom Domain

```bash
# 1. Add domain in Railway dashboard
railway domain add yourdomain.com

# 2. Update DNS records (A/CNAME as shown in Railway)

# 3. Update environment variables
railway variables set NEXTAUTH_URL=https://yourdomain.com
```

### 5. Production Build Configuration

Create `railway.json`:

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "sleepApplication": false,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

## Enterprise Deploy (AWS)

For high-scale applications requiring full infrastructure control.

### 1. Infrastructure Setup

```yaml
# docker-compose.yml for local testing
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/scheduler
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=your-secret
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: scheduler
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### 2. AWS Services Setup

```bash
# 1. Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier scheduler-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password your-password \
  --allocated-storage 20

# 2. Create ElastiCache Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id scheduler-redis \
  --cache-node-type cache.t3.micro \
  --engine redis

# 3. Create ECS cluster
aws ecs create-cluster --cluster-name scheduler-cluster
```

### 3. Container Configuration

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### 4. ECS Task Definition

```json
{
  "family": "scheduler-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "scheduler",
      "image": "your-account.dkr.ecr.region.amazonaws.com/scheduler:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:scheduler/database"
        },
        {
          "name": "NEXTAUTH_SECRET",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:scheduler/auth"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/scheduler",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

## Database Migration

### SQLite to PostgreSQL Migration

#### 1. Export Data from SQLite

```bash
# Install sqlite3 and pg_dump tools
npm install -g sqlite3

# Export data
sqlite3 prisma/dev.db .dump > sqlite_backup.sql
```

#### 2. Convert Schema

```bash
# Update prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

# Generate new migration
npx prisma migrate dev --name postgresql_migration
```

#### 3. Data Migration Script

Create `scripts/migrate-data.js`:

```javascript
const { PrismaClient } = require('@prisma/client');
const sqlite3 = require('sqlite3');

const sqlitePrisma = new PrismaClient({
  datasources: { db: { url: 'file:./prisma/dev.db' } }
});

const postgresPrisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
});

async function migrateData() {
  try {
    // Migrate users
    const users = await sqlitePrisma.user.findMany({
      include: {
        services: true,
        serviceCategories: true,
        clients: true,
        appointments: true,
        schedulingPage: true
      }
    });

    for (const user of users) {
      await postgresPrisma.user.create({
        data: {
          ...user,
          services: { create: user.services },
          serviceCategories: { create: user.serviceCategories },
          clients: { create: user.clients },
          appointments: { create: user.appointments },
          schedulingPage: user.schedulingPage ? { create: user.schedulingPage } : undefined
        }
      });
    }

    console.log(`Migrated ${users.length} users successfully`);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sqlitePrisma.$disconnect();
    await postgresPrisma.$disconnect();
  }
}

migrateData();
```

#### 4. Run Migration

```bash
# Set production database URL
export DATABASE_URL="postgresql://user:pass@host:5432/db"

# Run migration script
node scripts/migrate-data.js

# Verify migration
npx prisma studio
```

## Environment Configuration

### Production Environment Variables

Create comprehensive environment configuration:

```bash
# Core Application
NODE_ENV="production"
PORT="3000"

# Database
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
DATABASE_POOL_SIZE="10"

# Authentication
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-32-character-secret-key-here"

# OAuth Providers
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# Optional: Additional OAuth providers
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Email (for notifications)
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"
EMAIL_FROM="noreply@yourdomain.com"

# File Storage (AWS S3)
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_S3_BUCKET="scheduler-uploads"
AWS_REGION="us-east-1"

# Redis (for caching and sessions)
REDIS_URL="redis://user:pass@host:6379"

# Monitoring
SENTRY_DSN="https://your-sentry-dsn"
ANALYTICS_ID="your-google-analytics-id"

# Rate Limiting
RATE_LIMIT_WINDOW="15"  # minutes
RATE_LIMIT_MAX="100"    # requests per window
```

### Environment Variable Security

```bash
# Use AWS Secrets Manager
aws secretsmanager create-secret \
  --name "scheduler/database" \
  --description "Database connection string" \
  --secret-string "postgresql://user:pass@host:5432/db"

# Use Railway secrets
railway variables set DATABASE_URL "postgresql://..."

# Use Vercel environment variables
vercel env add DATABASE_URL production
```

## Domain & SSL Setup

### 1. Domain Registration

```bash
# Register domain through any registrar
# Recommended: Namecheap, Cloudflare, Google Domains
```

### 2. DNS Configuration

```dns
# A Records (for root domain)
yourdomain.com.     A     1.2.3.4

# CNAME Records (for subdomains)
www.yourdomain.com. CNAME yourdomain.com.
api.yourdomain.com. CNAME yourdomain.com.

# MX Records (for email)
yourdomain.com.     MX    10 mail.yourdomain.com.

# TXT Records (for verification)
yourdomain.com.     TXT   "v=spf1 include:_spf.google.com ~all"
```

### 3. SSL Certificate Setup

#### Automatic SSL (Vercel/Railway)
```bash
# SSL is automatically handled by platform
# Just add domain in dashboard
```

#### Manual SSL (AWS)
```bash
# Request certificate
aws acm request-certificate \
  --domain-name yourdomain.com \
  --subject-alternative-names www.yourdomain.com \
  --validation-method DNS

# Add CNAME records as provided by ACM
```

### 4. CDN Configuration (Cloudflare)

```javascript
// next.config.js - CDN optimization
const nextConfig = {
  images: {
    domains: ['yourdomain.com'],
    loader: 'cloudinary',
    path: 'https://res.cloudinary.com/your-cloud/image/fetch/',
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};
```

## CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run type check
        run: npx tsc --noEmit
      
      - name: Generate Prisma client
        run: npx prisma generate
      
      - name: Run tests (when added)
        run: npm test

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Generate Prisma client
        run: npx prisma generate
      
      - name: Build application
        run: npm run build
        env:
          NODE_ENV: production

  deploy:
    runs-on: ubuntu-latest
    needs: [test, build]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
      
      - name: Run database migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run security audit
        run: npm audit --audit-level moderate
      
      - name: Scan for secrets
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: main
          head: HEAD
```

### Database Migration Automation

Create `.github/workflows/migrate.yml`:

```yaml
name: Database Migration

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to migrate'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production

jobs:
  migrate:
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment }}
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run migrations
        run: |
          npx prisma migrate deploy
          npx prisma generate
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      
      - name: Verify migration
        run: npx prisma migrate status
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## Monitoring & Analytics

### 1. Application Monitoring (Sentry)

```bash
# Install Sentry
npm install @sentry/nextjs
```

Create `sentry.client.config.js`:

```javascript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  beforeSend(event) {
    // Filter out development errors
    if (event.environment === 'development') {
      return null;
    }
    return event;
  },
});
```

### 2. Performance Monitoring

```javascript
// lib/monitoring.js
import { performance } from 'perf_hooks';

export function trackPageLoad(pageName) {
  const startTime = performance.now();
  
  return () => {
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    
    // Send to analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_load_time', {
        page_name: pageName,
        load_time: Math.round(loadTime),
      });
    }
  };
}

export function trackAPICall(endpoint, method) {
  const startTime = performance.now();
  
  return (status) => {
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    console.log(`API ${method} ${endpoint}: ${status} (${Math.round(responseTime)}ms)`);
  };
}
```

### 3. Database Monitoring

```javascript
// lib/db-monitoring.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'info', emit: 'event' },
    { level: 'warn', emit: 'event' },
  ],
});

prisma.$on('query', (e) => {
  if (e.duration > 1000) { // Log slow queries (>1s)
    console.warn(`Slow query detected: ${e.query} (${e.duration}ms)`);
  }
});

prisma.$on('error', (e) => {
  console.error('Database error:', e);
});

export default prisma;
```

### 4. User Analytics

```javascript
// lib/analytics.js
export function trackUserAction(action, properties = {}) {
  // Google Analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      ...properties,
      user_id: properties.userId,
    });
  }
  
  // Custom analytics
  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action,
      properties,
      timestamp: new Date().toISOString(),
    }),
  }).catch(console.error);
}

// Usage in components
trackUserAction('service_created', {
  service_type: 'consultation',
  duration: 60,
  price: 100,
});
```

## Security Best Practices

### 1. Environment Security

```bash
# Never commit secrets to git
echo ".env*" >> .gitignore
echo "!.env.example" >> .gitignore

# Use secret management services
# AWS Secrets Manager, Railway secrets, Vercel env vars
```

### 2. API Security

```javascript
// middleware/security.js
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Rate limiting
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
});

// Security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
});
```

### 3. Input Validation

```javascript
// lib/validation.js
import { z } from 'zod';

export const createServiceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  duration: z.number().min(5).max(480),
  price: z.number().min(0).max(10000),
  categoryId: z.string().uuid().optional(),
});

// Usage in API routes
export async function POST(request) {
  try {
    const body = await request.json();
    const validatedData = createServiceSchema.parse(body);
    // Process validated data
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    throw error;
  }
}
```

### 4. Database Security

```javascript
// lib/prisma.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Row Level Security helper
export async function getUserData(userId, model, operation, data = {}) {
  // Always include userId in queries for tenant isolation
  const baseWhere = { userId };
  
  switch (operation) {
    case 'findMany':
      return prisma[model].findMany({
        where: { ...baseWhere, ...data.where },
        ...data.options,
      });
    
    case 'create':
      return prisma[model].create({
        data: { ...data, userId },
      });
    
    case 'update':
      return prisma[model].updateMany({
        where: { id: data.id, userId },
        data: data.updates,
      });
    
    case 'delete':
      return prisma[model].deleteMany({
        where: { id: data.id, userId },
      });
  }
}
```

## Performance Optimization

### 1. Next.js Optimization

```javascript
// next.config.js
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Enable static exports for better performance
  output: 'standalone',
};
```

### 2. Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX CONCURRENTLY idx_services_user_id ON services(user_id);
CREATE INDEX CONCURRENTLY idx_appointments_user_date ON appointments(user_id, start_time);
CREATE INDEX CONCURRENTLY idx_clients_user_email ON clients(user_id, email);

-- Composite indexes for filtered queries
CREATE INDEX CONCURRENTLY idx_services_user_visible ON services(user_id, is_visible);
CREATE INDEX CONCURRENTLY idx_appointments_user_status ON appointments(user_id, status);
```

### 3. Caching Strategy

```javascript
// lib/cache.js
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function getCachedData(key, fetcher, ttl = 300) {
  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.warn('Cache read error:', error);
  }
  
  const data = await fetcher();
  
  try {
    await redis.setex(key, ttl, JSON.stringify(data));
  } catch (error) {
    console.warn('Cache write error:', error);
  }
  
  return data;
}

// Usage
const services = await getCachedData(
  `services:${userId}`,
  () => prisma.service.findMany({ where: { userId } }),
  600 // 10 minutes
);
```

### 4. Image Optimization

```javascript
// components/OptimizedImage.jsx
import Image from 'next/image';

export default function OptimizedImage({ src, alt, ...props }) {
  return (
    <Image
      src={src}
      alt={alt}
      loading="lazy"
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      {...props}
    />
  );
}
```

## Scaling Strategies

### 1. Horizontal Scaling

```yaml
# docker-compose.scale.yml
version: '3.8'
services:
  app:
    image: scheduler:latest
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '0.50'
          memory: 512M
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - db
      - redis

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - app
```

### 2. Database Scaling

```javascript
// lib/db-pool.js
import { PrismaClient } from '@prisma/client';

// Read replicas for scaling
const writeDB = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_WRITE_URL } },
});

const readDB = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_READ_URL } },
});

export async function executeRead(query) {
  return readDB.$queryRaw(query);
}

export async function executeWrite(query) {
  return writeDB.$queryRaw(query);
}

// Usage
const services = await executeRead`
  SELECT * FROM services WHERE user_id = ${userId}
`;
```

### 3. Auto-scaling Configuration

```yaml
# k8s/deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: scheduler-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: scheduler
  template:
    metadata:
      labels:
        app: scheduler
    spec:
      containers:
      - name: scheduler
        image: scheduler:latest
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: scheduler-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: scheduler-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## Maintenance & Updates

### 1. Health Checks

```javascript
// app/api/health/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check Redis connection (if using)
    // await redis.ping();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'up',
        redis: 'up',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
```

### 2. Backup Strategy

```bash
# Automated daily backups
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="scheduler"

# Create backup
pg_dump $DATABASE_URL > "$BACKUP_DIR/backup_$DATE.sql"

# Compress backup
gzip "$BACKUP_DIR/backup_$DATE.sql"

# Upload to S3
aws s3 cp "$BACKUP_DIR/backup_$DATE.sql.gz" "s3://scheduler-backups/"

# Clean up old backups (keep 30 days)
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

### 3. Update Strategy

```bash
# Zero-downtime deployment script
#!/bin/bash

# 1. Build new version
docker build -t scheduler:latest .

# 2. Run database migrations
npx prisma migrate deploy

# 3. Health check new version
docker run --rm scheduler:latest node -e "console.log('Build successful')"

# 4. Rolling update (Kubernetes)
kubectl rollout restart deployment/scheduler-app
kubectl rollout status deployment/scheduler-app

# 5. Verify deployment
curl -f https://yourdomain.com/api/health || exit 1

echo "Deployment completed successfully"
```

### 4. Monitoring Alerts

```yaml
# alerts.yml (Prometheus/Grafana)
groups:
- name: scheduler-alerts
  rules:
  - alert: HighResponseTime
    expr: http_request_duration_seconds{quantile="0.95"} > 0.5
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High response time detected"
      
  - alert: DatabaseConnectionFailure
    expr: up{job="postgres"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Database connection failed"
      
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High error rate detected"
```

## Cost Optimization

### Platform Cost Comparison

| Platform | Setup Cost | Monthly Cost (1K users) | Monthly Cost (10K users) |
|----------|------------|-------------------------|--------------------------|
| **Vercel** | $0 | $20-50 | $200-500 |
| **Railway** | $0 | $50-100 | $200-400 |
| **AWS** | $100-500 | $100-200 | $300-800 |

### Cost Optimization Tips

1. **Use CDN**: Reduce bandwidth costs
2. **Optimize Images**: Use WebP/AVIF formats
3. **Database Indexing**: Reduce query costs
4. **Caching**: Reduce database load
5. **Monitoring**: Track usage and optimize

## Troubleshooting Guide

### Common Issues

#### 1. Database Connection Issues
```bash
# Check connection string
echo $DATABASE_URL

# Test connection
npx prisma db pull

# Check SSL requirements
psql "$DATABASE_URL?sslmode=require"
```

#### 2. Build Failures
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npx tsc --noEmit
```

#### 3. Authentication Issues
```bash
# Verify environment variables
echo $NEXTAUTH_URL
echo $NEXTAUTH_SECRET

# Check OAuth configuration
curl -f "$NEXTAUTH_URL/api/auth/providers"
```

#### 4. Performance Issues
```bash
# Check slow queries
tail -f /var/log/postgresql/postgresql.log | grep "slow query"

# Monitor resource usage
docker stats scheduler-app

# Check memory leaks
node --inspect app.js
```

---

## Quick Reference

### Deployment Checklist

- [ ] Domain registered and DNS configured
- [ ] SSL certificate setup
- [ ] Production database created
- [ ] Environment variables configured
- [ ] OAuth providers configured for production
- [ ] Database migrations run
- [ ] Health checks implemented
- [ ] Monitoring setup
- [ ] Backup strategy implemented
- [ ] CI/CD pipeline configured

### Emergency Contacts

- **Platform Support**: [Vercel](https://vercel.com/support), [Railway](https://railway.app/help)
- **Database Support**: [Neon](https://neon.tech/docs), [PlanetScale](https://planetscale.com/docs)
- **Domain/DNS**: Your registrar support
- **Monitoring**: [Sentry](https://sentry.io/support/), [DataDog](https://docs.datadoghq.com/)

### Useful Commands

```bash
# Check deployment status
vercel logs
railway logs

# Run migrations
npx prisma migrate deploy

# Check database status
npx prisma migrate status

# Generate Prisma client
npx prisma generate

# Build for production
npm run build
```

---

*Last updated: January 2025*
*For deployment assistance, refer to this guide or consult the development team.*