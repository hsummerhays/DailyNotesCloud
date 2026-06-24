# DailyNotesCloud - Express Backend API

This is the lightweight backend API for DailyNotesCloud, built with **Express (Node.js)**, **TypeScript**, and **PostgreSQL**.

---

## Core Refactored Architecture

The backend has been restructured from a single-file prototype into a modular, production-grade API following enterprise standards:

```text
├── migrations/             # Database migrations managed by node-pg-migrate
├── src/
│   ├── __tests__/          # Integration tests (Vitest + Supertest)
│   ├── db/
│   │   ├── index.ts        # pg-pool database client connection setup
│   │   └── seed.ts         # Database seed script for local demo data
│   ├── middleware/
│   │   └── errorHandler.ts # Global express error and 404 handlers
│   ├── routes/             # Modular API controllers
│   │   ├── health.ts       # Health check and DB-connectivity verification
│   │   ├── notes.ts        # Note CRUD routing
│   │   └── tasks.ts        # Task CRUD routing
│   ├── services/
│   │   └── demoUser.ts     # Service to fetch/provision default user records
│   ├── validation/
│   │   └── schemas.ts      # Zod validation schemas for request bodies
│   ├── app.ts              # Express application assembly (security & routers)
│   └── server.ts           # HTTP server startup entrypoint
├── tsconfig.json           # TypeScript compilation configurations
└── package.json            # Scripts, dependencies, and engines
```

---

## Features

- **Database Migrations**: Incremental, version-controlled schema changes using `node-pg-migrate` instead of ad-hoc scripts.
- **Robust Security**: Protected with `helmet` for HTTP headers and `cors` with domain whitelisting.
- **Abuse Protection**: Generous but bounded rate limiting via `express-rate-limit` to prevent DDoS or scraping.
- **Schema Validation**: Safe, type-strict request validation using `zod` before processing any SQL.
- **Mock-Free Testing**: Separation of app declaration (`app.ts`) and server listening (`server.ts`) allowing rapid integration testing without occupying network ports.

---

## Development & Operations

### 1. Environment Setup
Create a local `.env` file inside `/backend` (see `.env.example` for defaults):
```env
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dailynotescloud?schema=public
CORS_ORIGIN=http://localhost:3000
```

### 2. Database Schema Migrations
We manage our PostgreSQL tables using versioned SQL files under `/migrations`.

- **Apply all migrations**:
  ```bash
  npm run migrate:up
  ```
- **Rollback last migration**:
  ```bash
  npm run migrate:down
  ```
- **Create new migration**:
  ```bash
  npm run migrate:create <migration-name>
  ```

### 3. Local Seeding
Initialize the database with sample notes, tasks, and tags:
```bash
npm run db:seed
```

### 4. Run Server Locally
- **Development Mode** (with hot reloading via `tsx watch`):
  ```bash
  npm run dev
  ```
- **Production Build & Start**:
  ```bash
  npm run build
  npm start
  ```

---

## Testing

The backend uses **Vitest** and **Supertest** to test routes. The database layer is mocked during testing, making the test suite completely independent of external dependencies.

### Run Tests
```bash
npm test
```
