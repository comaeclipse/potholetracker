# FixMyStreet Pothole Reporter

TypeScript + Express + Prisma scaffold for the FixMyStreet pothole reporter experience. The goal is to preserve the visual design found in `demo.txt` while delivering a production-ready architecture that targets PostgreSQL through Prisma.

## Stack
- **Runtime:** Node.js 20+, TypeScript
- **Web server:** Express
- **ORM:** Prisma (PostgreSQL)
- **Validation:** Zod
- **Static front end:** HTML/CSS/JS served from `public/`

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env template and update the database connection string if needed:
   ```bash
   cp .env.example .env
   ```
3. Run Prisma migrations (creates the schema in the configured database):
   ```bash
   npx prisma migrate dev --name init
   ```
4. Seed sample data (mirrors the cards visible in the demo):
   ```bash
   npm run prisma:seed
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```
   The UI is served at <http://localhost:3000>. API routes are prefixed with `/api`.

## Project Structure
```
.
├── docs/
│   └── architecture.md
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
│   ├── app.js
│   └── index.html
├── src/
│   ├── controllers/
│   │   └── reportController.ts
│   ├── lib/
│   │   └── prisma.ts
│   ├── repositories/
│   │   └── reportRepository.ts
│   ├── routes/
│   │   └── reportRoutes.ts
│   ├── services/
│   │   └── reportService.ts
│   ├── types/
│   │   └── report.ts
│   └── server.ts
├── package.json
└── tsconfig.json
```

## API Overview

- `GET /api/reports` – List all pothole reports.
- `GET /api/reports/:id` – Retrieve a single report.
- `POST /api/reports` – Create a new report (validated with Zod).
- `PATCH /api/reports/:id` – Update a report.
- `DELETE /api/reports/:id` – Remove a report.
- `POST /api/reports/:id/votes/up` – Increment the up-vote counter.
- `POST /api/reports/:id/votes/down` – Increment the down-vote counter.

## Further Work
- Add authentication + per-user submissions.
- Build automated tests (unit/integration) for services and controllers.
- Replace inline CSS with componentized styling once the design is finalized.
