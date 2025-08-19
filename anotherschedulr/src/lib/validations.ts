import { z } from 'zod';

// Helper to sanitize HTML and prevent XSS
export function sanitizeHtml(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// User registration schema
export const registerSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .transform(sanitizeHtml),
  email: z.string()
    .email('Invalid email address')
    .toLowerCase()
    .max(255, 'Email must be less than 255 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number, and special character'
    ),
});

// Service schema
export const serviceSchema = z.object({
  name: z.string()
    .min(1, 'Service name is required')
    .max(200, 'Service name must be less than 200 characters')
    .transform(sanitizeHtml),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .transform(val => val ? sanitizeHtml(val) : val),
  duration: z.number()
    .int()
    .min(5, 'Duration must be at least 5 minutes')
    .max(480, 'Duration must be less than 8 hours'),
  price: z.number()
    .min(0, 'Price cannot be negative')
    .max(999999, 'Price is too high'),
  categoryId: z.string().uuid().optional().nullable(),
  isVisible: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  paddingTime: z.number().int().min(0).max(120).optional(),
  isPrivate: z.boolean().optional(),
});

// Service category schema
export const serviceCategorySchema = z.object({
  name: z.string()
    .min(1, 'Category name is required')
    .max(100, 'Category name must be less than 100 characters')
    .transform(sanitizeHtml),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .transform(val => val ? sanitizeHtml(val) : val),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  isVisible: z.boolean().optional(),
});

// Blocked time schema
export const blockedTimeSchema = z.object({
  startTime: z.string().datetime('Invalid start time'),
  endTime: z.string().datetime('Invalid end time'),
  reason: z.string()
    .max(500, 'Reason must be less than 500 characters')
    .optional()
    .transform(val => val ? sanitizeHtml(val) : val),
  isRecurring: z.boolean().optional(),
  recurrenceType: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).optional().nullable(),
  recurrenceEnd: z.string().datetime('Invalid recurrence end date').optional().nullable(),
});

// Scheduling page schema
export const schedulingPageSchema = z.object({
  isPublic: z.boolean().optional(),
  customDomain: z.string()
    .max(255, 'Domain must be less than 255 characters')
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9-_.]+[a-zA-Z0-9]$/, 'Invalid domain format')
    .optional()
    .nullable(),
  welcomeMessage: z.string()
    .max(1000, 'Welcome message must be less than 1000 characters')
    .optional()
    .transform(val => val ? sanitizeHtml(val) : val)
    .nullable(),
  primaryColor: z.string()
    .regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color')
    .optional(),
  secondaryColor: z.string()
    .regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color')
    .optional(),
  fontFamily: z.string()
    .max(100, 'Font family must be less than 100 characters')
    .optional(),
  customCSS: z.string()
    .max(10000, 'Custom CSS must be less than 10000 characters')
    .optional()
    .nullable(),
  businessHours: z.string()
    .max(5000, 'Business hours data is too large')
    .optional()
    .nullable(),
  timezone: z.string()
    .max(50, 'Timezone must be less than 50 characters')
    .optional(),
  allowOnlineBooking: z.boolean().optional(),
  requireApproval: z.boolean().optional(),
});

// Client schema
export const clientSchema = z.object({
  name: z.string()
    .min(1, 'Client name is required')
    .max(200, 'Client name must be less than 200 characters')
    .transform(sanitizeHtml),
  email: z.string()
    .email('Invalid email address')
    .toLowerCase()
    .max(255, 'Email must be less than 255 characters'),
  phone: z.string()
    .max(20, 'Phone number must be less than 20 characters')
    .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format')
    .optional()
    .nullable(),
  notes: z.string()
    .max(2000, 'Notes must be less than 2000 characters')
    .optional()
    .transform(val => val ? sanitizeHtml(val) : val)
    .nullable(),
});

// Appointment schema
export const appointmentSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .transform(sanitizeHtml),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .transform(val => val ? sanitizeHtml(val) : val)
    .nullable(),
  startTime: z.string().datetime('Invalid start time'),
  endTime: z.string().datetime('Invalid end time'),
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']).optional(),
  clientId: z.string().uuid('Invalid client ID'),
  serviceId: z.string().uuid('Invalid service ID').optional().nullable(),
});

// Generic ID parameter validation
export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

// Date range validation
export const dateRangeSchema = z.object({
  startDate: z.string().datetime('Invalid start date').optional(),
  endDate: z.string().datetime('Invalid end date').optional(),
});

// Helper function to validate request body
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await request.json();
    const validated = schema.parse(body);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, error: errorMessages.join(', ') };
    }
    return { success: false, error: 'Invalid request body' };
  }
}

// Helper function to validate query parameters
export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } {
  try {
    const params = Object.fromEntries(searchParams.entries());
    const validated = schema.parse(params);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, error: errorMessages.join(', ') };
    }
    return { success: false, error: 'Invalid query parameters' };
  }
}