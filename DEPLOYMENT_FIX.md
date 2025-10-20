# Deployment Fix Guide

## Problem Summary

Your Pothole Reporter app was experiencing two critical errors when deployed to Vercel:

1. **SyntaxError in app.js:33**: `Unexpected token '<', "<!DOCTYPE "... is not valid JSON`
   - The API was returning HTML instead of JSON responses
   - This occurred because Vercel was serving a 405 error page instead of routing to the API

2. **405 Method Not Allowed on POST /api/reports**
   - POST requests to the API were being rejected
   - This happened because Vercel wasn't properly routing requests to the API handlers

## Root Cause

Vercel is a **serverless platform** that requires Express apps to be restructured into **serverless functions**. Your app had a traditional Express server (`src/server.ts`) which doesn't work correctly on Vercel's platform.

## Solution Implemented

### 1. Created Vercel Serverless Functions (`/api` directory)

Converted your Express routes into Vercel serverless function handlers:

- **`api/reports.ts`** - Handles `GET /api/reports` and `POST /api/reports`
- **`api/reports/[id].ts`** - Handles `GET /api/reports/[id]`, `PATCH`, and `DELETE`
- **`api/reports/[id]/votes/[direction].ts`** - Handles `POST /api/reports/:id/votes/:direction`

Each handler:
- Uses the `@vercel/node` package for typing
- Implements proper CORS headers to prevent cross-origin issues
- Handles preflight OPTIONS requests
- Returns proper HTTP status codes
- Re-uses your existing business logic from the service layer

### 2. Updated Configuration Files

**`vercel.json`**
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": null,
  "env": {
    "NODE_ENV": "production"
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    }
  ]
}
```

This tells Vercel:
- How to build the project
- That it's not a specific framework (we're using custom serverless functions)
- To route `/api/*` requests to the serverless functions

**`tsconfig.json`**
- Added `"api"` to the `include` array so API handlers compile
- Set `"noImplicitAny": false` to allow lenient typing for handler functions

**`package.json`**
- Added `@vercel/node` as a dev dependency
- Updated build script: `"build": "npm run prisma:generate && tsc"`
  - This ensures Prisma client is generated and all TypeScript (including API functions) is compiled

### 3. File Structure

```
PotholeReporter/
├── api/                           # NEW: Vercel serverless functions
│   ├── reports.ts                # GET/POST /api/reports
│   ├── reports/
│   │   ├── [id].ts              # GET/PATCH/DELETE /api/reports/:id
│   │   └── [id]/
│   │       └── votes/
│   │           └── [direction].ts # POST /api/reports/:id/votes/:direction
├── src/
│   ├── server.ts                # KEEP: Local dev server
│   ├── controllers/
│   ├── services/
│   ├── routes/
│   └── ...
├── public/                       # Frontend files (unchanged)
└── vercel.json                   # NEW: Vercel config
```

## How It Works Now

### Local Development
```bash
npm run dev
```
Runs the traditional Express server on port 3000 - everything works as before.

### Vercel Deployment
When you push to GitHub:
1. Vercel detects your `vercel.json` configuration
2. Runs `npm run build` which:
   - Generates Prisma client
   - Compiles TypeScript (including `/api` serverless functions)
   - Outputs to `dist/` directory
3. Deploys serverless functions from `dist/api/` to Vercel's edge network
4. Serves static files from `public/` directory
5. Routes API requests to the appropriate serverless function

## Testing the Deployment

### Local Testing
```bash
# Build the project
npm run build

# Check that API files were compiled
ls dist/api/          # Should see: reports.js, reports/[id].js, etc.

# Run dev server
npm run dev
```

Visit `http://localhost:3000` and verify:
- Reports load without "Cannot parse JSON" error
- You can submit new reports
- Voting works correctly

### Vercel Testing
1. Push your changes: `git add . && git commit && git push`
2. Vercel will auto-deploy from the branch you configured
3. Visit your deployment URL (e.g., https://potholetracker.vercel.app)
4. Should see the same functionality working

## Environment Variables

Your `.env` file contains the `DATABASE_URL` for Neon PostgreSQL. For Vercel:

1. Go to Vercel Project Settings
2. Go to **Environment Variables**
3. Add these variables (copy from your local `.env`):
   - `DATABASE_URL`
   - `NODE_ENV=production`

The build script will automatically use these during deployment.

## Troubleshooting

### "405 Method Not Allowed"
- **Cause**: API functions not deployed or not routing correctly
- **Fix**: Ensure `vercel.json` exists and `npm run build` completes without errors

### "SyntaxError: Cannot parse JSON from HTML"
- **Cause**: API returning error page instead of JSON
- **Fix**: Check Vercel build logs - there may be a compilation error. Run `npm run build` locally and fix any TypeScript errors.

### Database Connection Error
- **Cause**: `DATABASE_URL` not set in Vercel environment
- **Fix**: Add it to Vercel project environment variables

### "Cannot find module '@prisma/client'"
- **Cause**: `npm run prisma:generate` didn't run during build
- **Fix**: Verify package.json `build` script includes `npm run prisma:generate &&`

## Important Notes

1. **Keep `src/server.ts`**: Still needed for local development
2. **Frontend unchanged**: Your HTML/CSS/JS in `public/` works as-is
3. **Database**: PostgreSQL connection continues to work the same way
4. **CORS**: Enabled for all origins in serverless functions (you may want to restrict this in production)

## Next Steps

1. Ensure `.env` has correct `DATABASE_URL`
2. Run `npm run build` locally and verify no errors
3. Commit and push changes to GitHub
4. Verify deployment on Vercel dashboard
5. Test all API endpoints on deployed URL
