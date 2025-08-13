# Database Seeding Guide

## Overview

This guide explains how to safely seed mock data in the AnotherSchedulr application without risking data loss.

## ⚠️ Important Safety Notes

1. **NEVER use `--force-reset` in production** - This will delete ALL data
2. **Always backup your database** before running seed scripts
3. **Use the safe seeding script** (`seed-mock-data-safe.js`) instead of the old one
4. **Check your environment** - The script has built-in production safeguards

## Available Scripts

### 1. Safe Mock Data Seeder (Recommended)

**File:** `scripts/seed-mock-data-safe.js`

This is the recommended script for adding mock data. It includes safety features:
- Won't delete existing data by default
- Tags all mock data with `[MOCK]` for easy identification
- Prevents destructive operations in production
- Allows targeting specific users

#### Basic Usage

```bash
# Add mock data to existing user (or create demo user if none exists)
node scripts/seed-mock-data-safe.js

# Seed data for a specific user
node scripts/seed-mock-data-safe.js --email user@example.com

# Clean existing mock data first (development only)
node scripts/seed-mock-data-safe.js --clean

# Combine flags
node scripts/seed-mock-data-safe.js --clean --email user@example.com
```

#### What It Creates

- **1 Demo User** (if no users exist)
  - Email: `demo@example.com`
  - Password: `demo123`
  
- **3 Service Categories**
  - Consultations
  - Follow-up Sessions
  - Workshops

- **5 Services**
  - Initial Consultation (60 min, $150)
  - Follow-up Session (45 min, $100)
  - Quick Check-in (30 min, $75)
  - Extended Session (90 min, $200)
  - Group Workshop (120 min, $250)

- **5 Mock Clients**
  - All marked with "(Mock)" in their names
  - Unique mock email addresses

- **8 Appointments**
  - Thursday: 5 appointments with proper spacing
  - Friday: 3 appointments
  - No overlapping times (15-minute gaps between)

### 2. Legacy Mock Data Seeder (Use with Caution)

**File:** `scripts/seed-mock-data.js`

⚠️ **Warning:** This script is less safe and should only be used in development.

```bash
# Basic usage (will create demo user if needed)
node scripts/seed-mock-data.js
```

## Production Deployment

### Initial Setup

1. **Run database migrations:**
   ```bash
   npx prisma migrate deploy
   ```

2. **Create admin user manually** (don't use seed scripts):
   ```bash
   # Use the application's registration flow
   # Or create via Prisma Studio in a secure environment
   ```

3. **Add sample data carefully:**
   ```bash
   NODE_ENV=production node scripts/seed-mock-data-safe.js --email admin@company.com
   ```

### Safety Checklist

- [ ] Backup database before any seeding operation
- [ ] Verify `NODE_ENV` is set correctly
- [ ] Never use `--clean` flag in production
- [ ] Test seed scripts in staging first
- [ ] Monitor database after seeding

## Cleaning Up Mock Data

### Safe Cleanup (Recommended)

The safe seeder tags all mock data with `[MOCK]` identifier:

```bash
# This only removes mock data, preserves real data
node scripts/seed-mock-data-safe.js --clean
```

### Manual Cleanup via Prisma Studio

1. Start Prisma Studio:
   ```bash
   npx prisma studio
   ```

2. Filter for records containing `[MOCK]` in descriptions/notes
3. Delete only those records

### Database Reset (Development Only!)

⚠️ **DANGER: This deletes ALL data!**

```bash
# Only for development - NEVER in production!
npx prisma db push --force-reset
```

## Troubleshooting

### Error: "No users found"

**Solution:** The script will create a demo user automatically, or you can register through the app first.

### Error: "Foreign key constraint"

**Cause:** Referenced user doesn't exist.

**Solution:** 
1. Check if users exist: `node scripts/get-user.js`
2. Create a user through the app
3. Use the `--email` flag to specify the correct user

### Error: "Cannot use --clean in production"

**Cause:** Safety feature preventing data loss.

**Solution:** This is intentional. Never clean data in production without proper backup and authorization.

### Error: "Module not found"

**Solution:** Install dependencies:
```bash
npm install
npx prisma generate
```

## Best Practices

1. **Development Workflow:**
   ```bash
   # Start fresh (development only)
   npx prisma db push --force-reset
   node scripts/seed-mock-data-safe.js
   ```

2. **Adding Test Data to Existing Database:**
   ```bash
   # Preserves existing data
   node scripts/seed-mock-data-safe.js
   ```

3. **Switching Between Users:**
   ```bash
   # Clean previous mock data and seed for new user
   node scripts/seed-mock-data-safe.js --clean --email newuser@example.com
   ```

4. **Production Data:**
   - Never seed mock data in production
   - Use application UI for real data entry
   - If seeding is necessary, use specific production scripts with audit logging

## Environment Variables

Ensure these are set in your `.env` file:

```env
# Database
DATABASE_URL="your_database_url"

# Environment (affects seeding behavior)
NODE_ENV="development"  # or "production"
```

## Mock Data Identification

All mock data created by the safe seeder includes `[MOCK]` tag:
- Service descriptions: `"...description [MOCK]"`
- Client notes: `"...notes [MOCK]"`
- Appointment descriptions: `"...details [MOCK]"`

This makes it easy to:
- Identify mock vs real data
- Clean up mock data selectively
- Filter mock data in queries

## Questions?

If you encounter issues not covered here:
1. Check the script's error messages and tips
2. Verify your database connection
3. Ensure migrations are up to date
4. Review the [main documentation](../README.md)

---

*Last updated: January 2025*