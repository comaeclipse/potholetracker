# Pothole Reporter Architecture

## Overview
The application is split into a TypeScript back end and a static-first front end that keeps the original visual design from `demo.txt`. The back end exposes REST endpoints for managing pothole reports and user interactions, while Prisma handles persistence against a PostgreSQL database. Static assets are served directly by the Express server, so no separate front-end build step is required to view the demo.

```
┌──────────────┐      ┌───────────────┐      ┌────────────────┐
│  Front end   │◄────►│  REST API      │◄────►│ PostgreSQL      │
│ (static HTML)│      │ (Express + TS) │      │ (Prisma client) │
└──────────────┘      └───────────────┘      └────────────────┘
```

## Data Model
- `Report`
  - `id`: Unique identifier.
  - `title`: Short description of the pothole.
  - `description`: Detailed description supplied by the reporter.
  - `location`: Free-form address string.
  - `latitude`/`longitude`: Optional geolocation coordinates.
  - `status`: Enum (`REPORTED`, `IN_PROGRESS`, `VERIFIED`, `FIXED`).
  - `upVotes`: Count of users supporting the report.
  - `downVotes`: Count of users opposing the report.
  - `imageUrl`: Optional image preview.
  - `reportedAt`: Timestamp for report creation.
  - `updatedAt`: Timestamp for last status change.

## Server Modules
- `src/server.ts`: Bootstraps Express, serves static assets, and wires routes.
- `src/routes/reportRoutes.ts`: REST routing layer for `/api/reports`.
- `src/controllers/reportController.ts`: Validates input and maps to services.
- `src/services/reportService.ts`: Business logic for reports.
- `src/repositories/reportRepository.ts`: Prisma-based data access.
- `src/lib/prisma.ts`: Singleton Prisma client.

## Front End
The HTML/CSS from `demo.txt` is migrated to `public/index.html` and enhanced with a light-weight TypeScript module (`public/app.ts`) that fetches data from the REST API but preserves the original layout and styling.

## Configuration & Tooling
- `package.json`: Defines scripts for development (`npm run dev`) and build/serve steps.
- `tsconfig.json`: Enables strict TypeScript across the back end.
- `prisma/schema.prisma`: Declares the data model and database connection.
- `.env.example`: Lists required environment variables (`DATABASE_URL`).

## Future Enhancements
- Implement authentication and user accounts for report submissions.
- Replace inline styles with componentized CSS if the design ever changes.
- Add automated tests (unit + integration) for the service and controllers.
