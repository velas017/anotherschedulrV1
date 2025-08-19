# Security Documentation

## Table of Contents
1. [Overview](#overview)
2. [Security Measures Implemented](#security-measures-implemented)
3. [Security Concepts Explained](#security-concepts-explained)
4. [Multi-Tenant Data Isolation](#multi-tenant-data-isolation)
5. [Security Vulnerabilities Fixed](#security-vulnerabilities-fixed)
6. [Best Practices](#best-practices)
7. [Incident Response](#incident-response)
8. [Security Checklist](#security-checklist)

## Overview

This document outlines the security measures implemented in the AnotherSchedulr application, a multi-tenant scheduling platform. The application handles sensitive business and customer data, requiring robust security controls at multiple layers.

### Key Security Principles
- **Defense in Depth**: Multiple layers of security controls
- **Least Privilege**: Users only access their own data
- **Zero Trust**: Verify every request, trust nothing by default
- **Data Minimization**: Only collect and log necessary information

## Security Measures Implemented

### 1. Authentication & Session Management

#### Implementation
- **NextAuth.js** with database sessions (30-day expiry)
- Support for credentials and OAuth (Google)
- Secure session cookies with httpOnly, sameSite, and secure flags
- CSRF protection built into NextAuth

#### Why It's Important
Authentication verifies user identity, while session management maintains that verified state. Database sessions provide better security than JWT tokens as they can be revoked immediately.

```typescript
// Session validation in API routes
const session = await getServerSession(authOptions);
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### 2. Input Validation & Sanitization

#### Implementation
- **Zod schemas** for all API endpoints
- HTML entity encoding to prevent XSS
- Type validation and boundary checks
- Custom sanitization functions

#### Example Schema
```typescript
export const serviceSchema = z.object({
  name: z.string()
    .min(1, 'Required')
    .max(200, 'Too long')
    .transform(sanitizeHtml),
  price: z.number()
    .min(0, 'Cannot be negative')
    .max(999999, 'Too high'),
});
```

#### Why It's Important
Prevents injection attacks (XSS, SQL injection) and ensures data integrity. Never trust user input.

### 3. Rate Limiting

#### Implementation
- Different limits for different endpoint types:
  - Auth endpoints: 5 attempts per 15 minutes
  - Public endpoints: 30 requests per minute  
  - API endpoints: 60 requests per minute
- In-memory store for development
- Headers indicate remaining requests and reset time

#### Why It's Important
Prevents brute force attacks, DDoS attempts, and API abuse. Protects server resources and ensures fair usage.

### 4. CORS (Cross-Origin Resource Sharing)

#### Implementation
- Configurable allowed origins via environment variables
- Validates origin header on every request
- Only allows specific domains to access public APIs

```typescript
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  process.env.NEXTAUTH_URL || 'http://localhost:3000',
];
```

#### Why It's Important
Prevents unauthorized websites from accessing your API. Without CORS, any website could make requests to your API using a logged-in user's credentials.

### 5. Security Headers

#### Headers Implemented
- **X-Content-Type-Options: nosniff** - Prevents MIME type sniffing
- **X-Frame-Options: DENY** - Prevents clickjacking attacks
- **X-XSS-Protection: 1; mode=block** - Enables browser XSS filters
- **Content-Security-Policy** - Controls resource loading
- **Referrer-Policy** - Controls referrer information
- **Permissions-Policy** - Disables unnecessary browser features

#### Why It's Important
These headers instruct browsers to enable security features that protect against common attacks like XSS, clickjacking, and data leakage.

### 6. Environment Variable Security

#### Implementation
- `.env.local` added to `.gitignore`
- `.env.example` template without real credentials
- Validation of required environment variables
- Different configs for dev/staging/production

#### Why It's Important
Prevents accidental exposure of secrets in version control. Leaked API keys and database credentials are a leading cause of breaches.

## Security Concepts Explained

### Cross-Site Scripting (XSS)
**What it is**: Malicious scripts injected into web pages viewed by other users.

**How we prevent it**:
- Input sanitization (HTML encoding)
- Content Security Policy headers
- React's built-in XSS protection

**Example Attack**: User enters `<script>alert('XSS')</script>` as their name.
**Prevention**: We encode it to `&lt;script&gt;alert('XSS')&lt;/script&gt;`

### SQL Injection
**What it is**: Malicious SQL code inserted into application queries.

**How we prevent it**:
- Prisma ORM with parameterized queries
- Input validation before database operations
- No raw SQL queries with user input

**Example Attack**: User enters `'; DROP TABLE users; --` in a form field.
**Prevention**: Prisma automatically escapes and parameterizes all queries.

### Cross-Site Request Forgery (CSRF)
**What it is**: Tricks users into performing unwanted actions on a site where they're authenticated.

**How we prevent it**:
- NextAuth CSRF tokens
- SameSite cookie attribute
- Origin validation for state-changing operations

### Session Hijacking
**What it is**: Stealing or manipulating user session tokens.

**How we prevent it**:
- HttpOnly cookies (not accessible via JavaScript)
- Secure flag (HTTPS only in production)
- Session rotation on privilege changes
- Database sessions that can be revoked

### Clickjacking
**What it is**: Tricking users into clicking hidden elements.

**How we prevent it**:
- X-Frame-Options: DENY header
- CSP frame-ancestors directive

## Multi-Tenant Data Isolation

### Tenant Isolation Strategy
Every database query MUST include the user's ID to ensure complete data isolation:

```typescript
// ✅ CORRECT: Filtered by userId
const services = await prisma.service.findMany({
  where: { userId: session.user.id }
});

// ❌ WRONG: No tenant filter - exposes all users' data!
const services = await prisma.service.findMany();
```

### Key Principles
1. **Row-Level Security**: Each record has a userId field
2. **Query Filtering**: All queries filter by authenticated user's ID
3. **Ownership Verification**: Check ownership before updates/deletes
4. **No Shared Resources**: Each tenant has completely isolated data

### Common Pitfalls to Avoid
- Forgetting userId filter in queries
- Using findFirst without userId constraint
- Bulk operations without tenant scoping
- Exposing internal IDs in public APIs

## Security Vulnerabilities Fixed

### 1. 🔴 CRITICAL: Exposed Credentials
**Issue**: `.env.local` not in `.gitignore`
**Risk**: Credentials could be committed to version control
**Fix**: Added `.env.local` and related files to `.gitignore`
**Action Required**: Rotate all exposed credentials immediately

### 2. 🔴 CRITICAL: Prisma Import Error
**Issue**: Incorrect import causing runtime crashes
**Risk**: Service availability and potential data exposure during errors
**Fix**: Changed to named import `import { prisma } from '@/lib/prisma'`

### 3. 🟡 HIGH: CORS Misconfiguration
**Issue**: `Access-Control-Allow-Origin: *` allows any origin
**Risk**: Any website could access user data
**Fix**: Implemented origin allowlist

### 4. 🟡 HIGH: Missing Rate Limiting
**Issue**: No protection against brute force attacks
**Risk**: Password guessing, DDoS, resource exhaustion
**Fix**: Implemented tiered rate limiting

### 5. 🟠 MEDIUM: Excessive Logging
**Issue**: Logging sensitive user data in production
**Risk**: Data leakage in logs
**Fix**: Conditional logging only in development

## Best Practices

### For Developers

#### API Development
```typescript
// Always validate input
const validation = await validateRequestBody(request, schema);
if (!validation.success) {
  return NextResponse.json({ error: validation.error }, { status: 400 });
}

// Always check authentication
const session = await getServerSession(authOptions);
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Always filter by tenant
const data = await prisma.model.findMany({
  where: { userId: session.user.id }
});
```

#### Security Testing
- Test with invalid/malicious input
- Verify tenant isolation with multiple users
- Check rate limiting works
- Validate CORS behavior
- Review security headers in browser

### For Operations

#### Environment Management
1. Use different credentials per environment
2. Rotate secrets quarterly (minimum)
3. Use secret management tools (AWS Secrets Manager, etc.)
4. Enable audit logging on all services
5. Monitor for exposed credentials in logs

#### Monitoring & Alerts
Set up alerts for:
- Multiple failed login attempts
- Rate limit violations
- Unexpected error rates
- Unusual data access patterns
- New deployment vulnerabilities

## Incident Response

### If Credentials Are Exposed
1. **Immediate Actions**:
   - Rotate affected credentials
   - Review access logs for unauthorized use
   - Check for any data breaches
   
2. **Investigation**:
   - Determine exposure duration
   - Identify affected systems
   - Review git history for exposure
   
3. **Remediation**:
   - Update all systems with new credentials
   - Implement additional monitoring
   - Document incident and lessons learned

### If Data Breach Suspected
1. **Contain**: Disable affected accounts/services
2. **Assess**: Determine scope and impact
3. **Notify**: Inform affected users per legal requirements
4. **Investigate**: Forensic analysis of logs
5. **Remediate**: Fix vulnerabilities
6. **Document**: Create incident report

## Security Checklist

### Before Each Deployment
- [ ] No hardcoded credentials in code
- [ ] All user inputs validated
- [ ] API endpoints check authentication
- [ ] Database queries filtered by tenant
- [ ] Rate limiting configured
- [ ] Security headers enabled
- [ ] CORS properly configured
- [ ] Logs don't contain sensitive data
- [ ] Dependencies updated (no known vulnerabilities)
- [ ] Environment variables properly set

### Regular Security Tasks
- [ ] Weekly: Review error logs for security issues
- [ ] Monthly: Audit user access patterns
- [ ] Quarterly: Rotate secrets and API keys
- [ ] Quarterly: Security dependency updates
- [ ] Annually: Full security audit
- [ ] Annually: Penetration testing

## Additional Resources

### Tools
- **OWASP ZAP**: Web application security scanner
- **npm audit**: Check for vulnerable dependencies
- **ESLint Security Plugin**: Static code analysis
- **Snyk**: Vulnerability monitoring

### References
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NextAuth Security](https://next-auth.js.org/getting-started/security)
- [Prisma Security Best Practices](https://www.prisma.io/docs/guides/security)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)

## Contact

For security concerns or to report vulnerabilities, please contact:
- Email: security@anotherschedulr.com
- Use PGP encryption for sensitive reports
- Do NOT create public GitHub issues for security vulnerabilities

---

*Last Updated: January 2025*
*Version: 1.0.0*