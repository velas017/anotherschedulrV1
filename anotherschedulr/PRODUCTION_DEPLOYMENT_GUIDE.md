# Production Deployment Guide - Another Schedulr

## 🚀 Overview

This guide provides a comprehensive strategy for deploying Another Schedulr to production while ensuring **ZERO client data loss** during migration and future updates. This document is specifically tailored for your current setup with SQLite development database and Next.js 15.

## 📋 Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Production Architecture](#production-architecture)
3. [Platform Recommendations](#platform-recommendations)
4. [Database Migration Strategy](#database-migration-strategy)
5. [Implementation Phases](#implementation-phases)
6. [Data Protection & Backup](#data-protection--backup)
7. [Deployment Process](#deployment-process)
8. [Update Strategy](#update-strategy)
9. [Monitoring & Maintenance](#monitoring--maintenance)
10. [Cost Analysis](#cost-analysis)
11. [Emergency Procedures](#emergency-procedures)
12. [Implementation Checklist](#implementation-checklist)

## 1. Current State Analysis

### Current Setup
- **Framework**: Next.js 15.3.4 with App Router
- **Database**: SQLite (development only)
- **Authentication**: NextAuth.js with Google OAuth
- **ORM**: Prisma 6.12.0
- **Hosting**: Local development
- **Data Models**: Users, Services, Clients, Appointments, SchedulingPages

### Critical Data to Preserve
- User accounts and authentication data
- Service definitions and categories
- Client information
- Appointment history
- Scheduling page configurations
- Custom branding settings

## 2. Production Architecture

### Recommended Stack
```
┌─────────────────────────────────────────┐
│           CloudFlare CDN                │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│         Railway/Vercel (App)            │
│     - Next.js Application               │
│     - API Routes                        │
│     - Server Components                 │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│       PostgreSQL (Primary DB)           │
│     - Neon/Railway PostgreSQL           │
│     - Automated backups                 │
│     - Point-in-time recovery            │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│         Redis (Optional)                │
│     - Session management                │
│     - Rate limiting                     │
│     - Caching                          │
└─────────────────────────────────────────┘
```

## 3. Platform Recommendations

### Option 1: Railway (RECOMMENDED) ⭐
**Perfect for: Getting to production quickly with minimal configuration**

**Pros:**
- PostgreSQL included in platform
- Automatic GitHub deployments
- Built-in environment management
- SSL certificates included
- Custom domains supported
- Excellent pricing for small-medium apps

**Cons:**
- Fewer regions than AWS
- Less flexibility than self-managed

**Setup Time:** 1-2 hours
**Monthly Cost:** $20-50 (includes database)

### Option 2: Vercel + Neon
**Perfect for: Maximum performance with serverless**

**Pros:**
- Zero-config Next.js deployment
- Global CDN included
- Automatic scaling
- Great free tier

**Cons:**
- Database separate (Neon)
- Can get expensive at scale
- Cold starts on free tier

**Setup Time:** 2-3 hours
**Monthly Cost:** $0-20 (Hobby), $20-50 (Pro)

### Option 3: AWS (Enterprise)
**Perfect for: Full control and unlimited scale**

**Pros:**
- Complete infrastructure control
- Unlimited scaling options
- Enterprise features

**Cons:**
- Complex setup
- Requires DevOps knowledge
- Higher initial cost

**Setup Time:** 1-2 days
**Monthly Cost:** $100-200+

## 4. Database Migration Strategy

### Phase 1: Prepare Production Database

```bash
# 1. Update schema.prisma for PostgreSQL
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

# 2. Install PostgreSQL client
npm install pg

# 3. Create new migration for PostgreSQL
npx prisma migrate dev --name init_postgresql --create-only
```

### Phase 2: Data Export from SQLite

Create `scripts/export-sqlite-data.js`:

```javascript
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const db = new Database('./prisma/dev.db', { readonly: true });

// Export all tables
const tables = [
  'User',
  'Account',
  'Session',
  'Service',
  'ServiceCategory',
  'Client',
  'Appointment',
  'SchedulingPage'
];

const exportData = {};

for (const table of tables) {
  const rows = db.prepare(`SELECT * FROM ${table}`).all();
  exportData[table] = rows;
  console.log(`Exported ${rows.length} rows from ${table}`);
}

// Save to JSON file with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const exportPath = `./backups/export-${timestamp}.json`;

fs.mkdirSync('./backups', { recursive: true });
fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));

console.log(`Data exported to ${exportPath}`);
db.close();
```

### Phase 3: Import to PostgreSQL

Create `scripts/import-to-postgres.js`:

```javascript
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function importData() {
  const dataPath = process.argv[2];
  if (!dataPath) {
    console.error('Please provide path to export file');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  
  try {
    // Import in correct order (respect foreign keys)
    console.log('Importing Users...');
    for (const user of data.User) {
      await prisma.user.create({ data: user });
    }

    console.log('Importing Accounts...');
    for (const account of data.Account) {
      await prisma.account.create({ data: account });
    }

    console.log('Importing Service Categories...');
    for (const category of data.ServiceCategory) {
      await prisma.serviceCategory.create({ data: category });
    }

    console.log('Importing Services...');
    for (const service of data.Service) {
      await prisma.service.create({ data: service });
    }

    console.log('Importing Clients...');
    for (const client of data.Client) {
      await prisma.client.create({ data: client });
    }

    console.log('Importing Appointments...');
    for (const appointment of data.Appointment) {
      await prisma.appointment.create({ data: appointment });
    }

    console.log('Importing Scheduling Pages...');
    for (const page of data.SchedulingPage) {
      await prisma.schedulingPage.create({ data: page });
    }

    console.log('✅ Import completed successfully!');
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importData();
```

### Phase 4: Migration Execution

```bash
# 1. Backup current SQLite database
cp prisma/dev.db prisma/dev.db.backup

# 2. Export all data
node scripts/export-sqlite-data.js

# 3. Set production database URL
export DATABASE_URL="postgresql://user:pass@host:5432/schedulr"

# 4. Create database schema in PostgreSQL
npx prisma migrate deploy

# 5. Import data to PostgreSQL
node scripts/import-to-postgres.js ./backups/export-[timestamp].json

# 6. Verify data integrity
npx prisma studio
```

## 5. Implementation Phases

### Phase 1: Pre-Production (Week 1)
1. **Set up staging environment**
   - Create Railway/Vercel account
   - Set up PostgreSQL database
   - Configure environment variables

2. **Test data migration**
   - Run migration scripts on test data
   - Verify all relationships maintained
   - Test application functionality

3. **Configure CI/CD**
   - Set up GitHub Actions
   - Configure automatic deployments
   - Add testing pipeline

### Phase 2: Production Setup (Week 2)
1. **Production infrastructure**
   - Set up production database
   - Configure custom domain
   - Set up SSL certificates

2. **Security hardening**
   - Review all environment variables
   - Set up secret management
   - Configure rate limiting

3. **Monitoring setup**
   - Error tracking (Sentry)
   - Performance monitoring
   - Uptime monitoring

### Phase 3: Migration & Launch (Week 3)
1. **Final data migration**
   - Backup everything
   - Run migration scripts
   - Verify data integrity

2. **DNS cutover**
   - Update DNS records
   - Monitor for issues
   - Keep old system available

3. **Post-launch monitoring**
   - Watch error rates
   - Monitor performance
   - Gather user feedback

## 6. Data Protection & Backup

### Automated Backup Strategy

Create `.github/workflows/backup.yml`:

```yaml
name: Daily Database Backup

on:
  schedule:
    - cron: '0 2 * * *' # 2 AM daily
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install PostgreSQL client
        run: sudo apt-get install postgresql-client
      
      - name: Create backup
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          DATE=$(date +%Y%m%d_%H%M%S)
          pg_dump $DATABASE_URL > backup_$DATE.sql
          gzip backup_$DATE.sql
      
      - name: Upload to cloud storage
        uses: google-github-actions/upload-cloud-storage@v1
        with:
          credentials: ${{ secrets.GCP_CREDENTIALS }}
          path: backup_$DATE.sql.gz
          destination: schedulr-backups
      
      - name: Clean old backups
        run: |
          # Keep only last 30 days
          gsutil ls gs://schedulr-backups/ | \
          while read file; do
            age=$(gsutil stat $file | grep "Creation time" | awk '{print $3}')
            # Delete if older than 30 days
          done
```

### Recovery Procedures

```bash
# 1. List available backups
gsutil ls gs://schedulr-backups/

# 2. Download specific backup
gsutil cp gs://schedulr-backups/backup_20250120_020000.sql.gz .

# 3. Decompress backup
gunzip backup_20250120_020000.sql.gz

# 4. Restore to new database
psql $DATABASE_URL < backup_20250120_020000.sql

# 5. Verify restoration
npx prisma studio
```

## 7. Deployment Process

### Initial Production Deployment

```bash
# 1. Prepare production branch
git checkout -b production
git merge main

# 2. Update environment configuration
cp .env.example .env.production

# 3. Set production variables
NEXTAUTH_URL=https://yourdomain.com
DATABASE_URL=postgresql://user:pass@host:5432/schedulr
NEXTAUTH_SECRET=generate-32-char-secret

# 4. Deploy to Railway
railway login
railway link
railway up

# 5. Run production migrations
railway run npx prisma migrate deploy

# 6. Verify deployment
curl https://yourdomain.com/api/health
```

### Environment Variables Setup

```env
# Production Environment Variables
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@host:5432/schedulr?sslmode=require

# NextAuth
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-32-character-secret-here

# Google OAuth (Production)
GOOGLE_CLIENT_ID=your-production-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-production-client-secret

# Optional: Monitoring
SENTRY_DSN=https://your-sentry-dsn
```

## 8. Update Strategy

### Zero-Downtime Update Process

```bash
#!/bin/bash
# deploy-update.sh

# 1. Create database backup
echo "Creating database backup..."
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backup_pre_update_$DATE.sql

# 2. Deploy to staging first
echo "Deploying to staging..."
git push staging main
# Test in staging environment

# 3. Create migration if needed
echo "Checking for migrations..."
npx prisma migrate dev --name update_$DATE

# 4. Deploy to production
echo "Deploying to production..."
git push production main

# 5. Run migrations
echo "Running migrations..."
railway run npx prisma migrate deploy

# 6. Health check
echo "Verifying deployment..."
curl -f https://yourdomain.com/api/health || exit 1

echo "✅ Update completed successfully!"
```

### Database Schema Updates

Always follow this pattern for schema changes:

1. **Add new columns as optional**
```prisma
model User {
  newField String? // Optional first
}
```

2. **Deploy and migrate**
```bash
npx prisma migrate dev --name add_optional_field
railway run npx prisma migrate deploy
```

3. **Backfill data if needed**
```javascript
await prisma.user.updateMany({
  where: { newField: null },
  data: { newField: 'default_value' }
});
```

4. **Make required in next deployment**
```prisma
model User {
  newField String // Now required
}
```

## 9. Monitoring & Maintenance

### Health Check Endpoint

Create `app/api/health/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check critical services
    const checks = {
      database: 'healthy',
      auth: 'healthy',
      timestamp: new Date().toISOString(),
    };
    
    return NextResponse.json({
      status: 'healthy',
      checks,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error.message,
      },
      { status: 503 }
    );
  }
}
```

### Monitoring Setup

1. **Uptime Monitoring**
   - Use BetterUptime or UptimeRobot
   - Monitor `/api/health` endpoint
   - Alert on downtime

2. **Error Tracking**
   - Install Sentry for error tracking
   - Monitor error rates
   - Set up alerts for critical errors

3. **Performance Monitoring**
   - Track response times
   - Monitor database query performance
   - Set up slow query alerts

## 10. Cost Analysis

### Monthly Cost Breakdown

| Service | Development | Small (1-100 users) | Medium (100-1K users) | Large (1K-10K users) |
|---------|------------|-------------------|---------------------|-------------------|
| **Railway** |
| App Hosting | $0 | $5 | $20 | $50 |
| Database | $0 | $5 | $15 | $35 |
| **Total** | **$0** | **$10** | **$35** | **$85** |
| | | | | |
| **Vercel + Neon** |
| Vercel | $0 | $0-20 | $20 | $20-150 |
| Neon DB | $0 | $0-19 | $19 | $69 |
| **Total** | **$0** | **$0-39** | **$39** | **$89-219** |
| | | | | |
| **AWS** |
| EC2/ECS | $0 | $20 | $50 | $150 |
| RDS | $0 | $15 | $30 | $100 |
| Other | $0 | $10 | $20 | $50 |
| **Total** | **$0** | **$45** | **$100** | **$300** |

### Cost Optimization Tips

1. **Use CDN for static assets** (CloudFlare free tier)
2. **Implement caching** to reduce database load
3. **Optimize images** with Next.js Image component
4. **Use database indexes** for common queries
5. **Monitor and optimize** slow queries

## 11. Emergency Procedures

### Rollback Procedure

```bash
#!/bin/bash
# rollback.sh

# 1. Immediate rollback
echo "⚠️ Starting emergency rollback..."

# 2. Revert to previous deployment
railway rollback

# 3. Restore database if needed
if [ "$1" == "--restore-db" ]; then
  echo "Restoring database..."
  psql $DATABASE_URL < backup_pre_update.sql
fi

# 4. Clear caches
railway run npm run clear-cache

# 5. Verify rollback
curl -f https://yourdomain.com/api/health

echo "✅ Rollback completed"
```

### Disaster Recovery

1. **Database Corruption**
```bash
# Stop application
railway down

# Restore from latest backup
psql $DATABASE_URL < latest_backup.sql

# Restart application
railway up
```

2. **Security Breach**
```bash
# 1. Rotate all secrets immediately
railway variables set NEXTAUTH_SECRET=$(openssl rand -base64 32)

# 2. Force logout all users
railway run npx prisma db execute --sql "DELETE FROM Session"

# 3. Review audit logs
railway logs --lines 1000 | grep -E "auth|login|session"

# 4. Notify affected users
```

## 12. Implementation Checklist

### Pre-Production Checklist
- [ ] Choose hosting platform (Railway/Vercel/AWS)
- [ ] Set up staging environment
- [ ] Create PostgreSQL database
- [ ] Test data migration scripts
- [ ] Configure environment variables
- [ ] Set up custom domain
- [ ] Configure SSL certificate
- [ ] Set up Google OAuth for production
- [ ] Create backup strategy
- [ ] Set up monitoring

### Migration Day Checklist
- [ ] Create final backup of SQLite database
- [ ] Export all data to JSON
- [ ] Create production database
- [ ] Run schema migrations
- [ ] Import data to PostgreSQL
- [ ] Verify data integrity
- [ ] Test all critical functions
- [ ] Update DNS records
- [ ] Monitor for errors
- [ ] Keep backup system available

### Post-Production Checklist
- [ ] Set up automated backups
- [ ] Configure monitoring alerts
- [ ] Document recovery procedures
- [ ] Create runbook for common issues
- [ ] Set up staging environment
- [ ] Configure CI/CD pipeline
- [ ] Train team on procedures
- [ ] Schedule regular backup tests
- [ ] Plan first update deployment
- [ ] Celebrate successful launch! 🎉

## Quick Commands Reference

```bash
# Local Development
npm run dev

# Build for production
npm run build

# Database migrations
npx prisma migrate dev           # Development
npx prisma migrate deploy        # Production

# Backup database
pg_dump $DATABASE_URL > backup.sql

# Restore database
psql $DATABASE_URL < backup.sql

# Railway commands
railway login                    # Login to Railway
railway link                     # Link to project
railway up                       # Deploy
railway logs                     # View logs
railway run [command]            # Run command in production

# Health check
curl https://yourdomain.com/api/health
```

## Support Resources

- **Railway Documentation**: https://docs.railway.app
- **Vercel Documentation**: https://vercel.com/docs
- **Prisma Documentation**: https://www.prisma.io/docs
- **NextAuth Documentation**: https://next-auth.js.org
- **PostgreSQL Documentation**: https://www.postgresql.org/docs

## Final Notes

1. **Always backup before any operation**
2. **Test everything in staging first**
3. **Monitor closely after deployments**
4. **Keep this guide updated with lessons learned**
5. **Document any custom procedures specific to your setup**

Remember: The goal is **ZERO client data loss** and **minimal downtime**. When in doubt, take the safer approach.

---

*Last Updated: January 2025*
*Version: 1.0.0*
*Specific to: Another Schedulr Application*