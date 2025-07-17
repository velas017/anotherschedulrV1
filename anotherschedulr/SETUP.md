# Authentication Setup Guide

## 🚀 Quick Start

The database is now configured with SQLite for development. To enable Google OAuth authentication, follow these steps:

### 1. Generate NextAuth Secret

Run this command to generate a secure secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output and replace `your-secret-key-here-change-this-to-a-random-string-for-production` in your `.env.local` file.

### 2. Set up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Select "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://yourdomain.com/api/auth/callback/google` (for production)
5. Copy the Client ID and Client Secret
6. Update your `.env.local` file:

```env
GOOGLE_CLIENT_ID="your-actual-google-client-id"
GOOGLE_CLIENT_SECRET="your-actual-google-client-secret"
```

### 3. Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/signup`

3. Click "Continue with Google" - this should now work!

## 🔒 Security Notes

- Never commit your `.env.local` file to version control
- Use different OAuth credentials for development and production
- The SQLite database (`dev.db`) is for development only
- For production, use PostgreSQL or another production database

## 📁 Current Setup

- **Database**: SQLite (`dev.db`) - ready to use
- **Authentication**: NextAuth with Google OAuth + email/password
- **Session management**: JWT with database adapter
- **Protected routes**: Dashboard requires authentication

## 🔄 Switching to PostgreSQL (Optional)

If you want to use PostgreSQL instead of SQLite:

1. Install PostgreSQL locally or use a cloud service (Neon, Supabase, etc.)
2. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Update your `.env.local`:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/anotherschedulr"
   ```
4. Run migrations:
   ```bash
   npx prisma migrate dev --name init
   ```

## ❓ Troubleshooting

- **Prisma Client Error**: Run `npx prisma generate`
- **Database Connection Error**: Check your `DATABASE_URL` in `.env.local`
- **Google OAuth Error**: Verify your redirect URIs in Google Cloud Console
- **Session Issues**: Clear your browser cookies and try again

The setup is now complete! You can test email/password registration and Google OAuth authentication.