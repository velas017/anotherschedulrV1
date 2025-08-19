import { prisma } from '@/lib/prisma';

// Reserved subdomains that cannot be used by users
const RESERVED_SUBDOMAINS = [
  'www',
  'api',
  'admin',
  'app',
  'mail',
  'ftp',
  'blog',
  'support',
  'help',
  'docs',
  'dashboard',
  'staging',
  'dev',
  'test',
  'preview',
  'cdn',
  'assets',
  'static',
  'status',
  'monitor',
  'health',
  'metrics',
  'analytics',
  'book',
  'booking',
  'schedule',
  'calendar',
  'signin',
  'signup',
  'login',
  'register',
  'auth',
  'oauth',
  'settings',
  'account',
  'billing',
  'payments',
  'webhooks',
  'notifications',
  'email',
  'sms',
  'tel',
  'phone',
  'contact',
  'about',
  'privacy',
  'terms',
  'legal',
  'security',
  'abuse',
  'dmca',
  'copyright',
  'trademark',
  'patents',
  'careers',
  'jobs',
  'press',
  'media',
  'news',
  'events',
  'community',
  'forum',
  'chat',
  'feedback',
  'reviews',
  'testimonials',
  'partners',
  'affiliates',
  'resellers',
  'developers',
  'integrations',
  'marketplace',
  'store',
  'shop',
  'checkout',
  'cart',
  'orders',
  'invoices',
  'receipts',
  'refunds',
  'returns',
  'shipping',
  'tracking',
  'delivery'
];

/**
 * Generate a URL-safe subdomain from user name or business name
 */
export function generateSubdomain(name?: string | null, businessName?: string | null): string {
  // Use name first, fallback to businessName, then generate random
  const source = name || businessName || 'user';
  
  // Convert to lowercase and replace spaces/special chars with hyphens
  let subdomain = source
    .toLowerCase()
    .trim()
    // Replace spaces and special characters with hyphens
    .replace(/[^a-z0-9]/g, '-')
    // Remove consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-|-$/g, '')
    // Limit to 63 characters (DNS limit)
    .substring(0, 63);

  // If empty after cleaning, generate a random subdomain
  if (!subdomain || subdomain.length < 3) {
    subdomain = `user-${Math.random().toString(36).substring(2, 8)}`;
  }

  return subdomain;
}

/**
 * Validate subdomain format and availability
 */
export function validateSubdomainFormat(subdomain: string): { isValid: boolean; error?: string } {
  // Check length (3-63 characters per DNS standards)
  if (subdomain.length < 3) {
    return { isValid: false, error: 'Subdomain must be at least 3 characters long' };
  }
  
  if (subdomain.length > 63) {
    return { isValid: false, error: 'Subdomain must be 63 characters or less' };
  }

  // Check format: alphanumeric and hyphens only, no consecutive hyphens, no leading/trailing hyphens
  const validFormat = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
  if (!validFormat.test(subdomain)) {
    return { 
      isValid: false, 
      error: 'Subdomain can only contain lowercase letters, numbers, and hyphens. Cannot start or end with a hyphen.' 
    };
  }

  // Check for consecutive hyphens
  if (subdomain.includes('--')) {
    return { isValid: false, error: 'Subdomain cannot contain consecutive hyphens' };
  }

  // Check if reserved
  if (RESERVED_SUBDOMAINS.includes(subdomain)) {
    return { isValid: false, error: 'This subdomain is reserved and cannot be used' };
  }

  return { isValid: true };
}

/**
 * Check if subdomain is available (not taken by another user)
 */
export async function isSubdomainAvailable(subdomain: string, excludeUserId?: string): Promise<boolean> {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { subdomain },
      select: { id: true }
    });

    // If no user found, it's available
    if (!existingUser) return true;

    // If excluding a specific user (for updates), check if it's the same user
    if (excludeUserId && existingUser.id === excludeUserId) return true;

    // Otherwise, it's taken
    return false;
  } catch (error) {
    console.error('Error checking subdomain availability:', error);
    return false;
  }
}

/**
 * Generate a unique subdomain by appending numbers if needed
 */
export async function generateUniqueSubdomain(
  name?: string | null, 
  businessName?: string | null, 
  excludeUserId?: string
): Promise<string> {
  const baseSubdomain = generateSubdomain(name, businessName);
  
  // First check if the base subdomain is valid and available
  const formatValidation = validateSubdomainFormat(baseSubdomain);
  if (!formatValidation.isValid) {
    // If base is invalid, generate a random one
    const randomSubdomain = `user-${Math.random().toString(36).substring(2, 8)}`;
    return generateUniqueSubdomain(randomSubdomain, undefined, excludeUserId);
  }

  if (await isSubdomainAvailable(baseSubdomain, excludeUserId)) {
    return baseSubdomain;
  }

  // If taken, try appending numbers
  for (let i = 2; i <= 999; i++) {
    const candidate = `${baseSubdomain}-${i}`;
    
    // Make sure candidate doesn't exceed length limit
    if (candidate.length > 63) {
      // Truncate base and try again
      const truncatedBase = baseSubdomain.substring(0, 63 - `-${i}`.length);
      const truncatedCandidate = `${truncatedBase}-${i}`;
      
      if (await isSubdomainAvailable(truncatedCandidate, excludeUserId)) {
        return truncatedCandidate;
      }
    } else {
      if (await isSubdomainAvailable(candidate, excludeUserId)) {
        return candidate;
      }
    }
  }

  // If all attempts failed, generate a random subdomain
  const randomSubdomain = `user-${Math.random().toString(36).substring(2, 12)}`;
  return randomSubdomain;
}

/**
 * Resolve user from subdomain
 */
export async function resolveUserFromSubdomain(subdomain: string): Promise<{ id: string } | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { subdomain },
      select: { id: true }
    });

    return user;
  } catch (error) {
    console.error('Error resolving user from subdomain:', error);
    return null;
  }
}

/**
 * Extract subdomain from hostname
 */
export function getSubdomainFromHost(host: string | null, baseDomain: string = 'localhost'): string | null {
  if (!host) return null;

  // Remove port if present
  const hostname = host.split(':')[0];
  
  // For localhost development, handle port-based subdomains
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null; // No subdomain support for localhost in development
  }

  // For production domains
  const parts = hostname.split('.');
  
  // If it's just the base domain (schedulr.app) or www.schedulr.app, no subdomain
  if (parts.length <= 2 || (parts.length === 3 && parts[0] === 'www')) {
    return null;
  }

  // Extract subdomain (first part)
  const subdomain = parts[0];
  
  // Validate subdomain format
  const validation = validateSubdomainFormat(subdomain);
  if (!validation.isValid) {
    return null;
  }

  return subdomain;
}

/**
 * Build subdomain URL for a user
 */
export function buildSubdomainUrl(subdomain: string, baseDomain: string = process.env.BASE_DOMAIN || 'schedulr.app'): string {
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  
  // For development, use localhost with path-based routing
  if (process.env.NODE_ENV !== 'production') {
    return `${protocol}://localhost:3000/book/${subdomain}`;
  }

  return `${protocol}://${subdomain}.${baseDomain}`;
}

/**
 * Check if the current request is from a subdomain
 */
export function isSubdomainRequest(host: string | null): boolean {
  const subdomain = getSubdomainFromHost(host);
  return subdomain !== null;
}