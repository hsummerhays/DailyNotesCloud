# DailyNotesCloud - Express Backend API

This is the lightweight backend API for DailyNotesCloud, built with **Express (Node.js)**, **TypeScript**, and **PostgreSQL**.

---

## Core Refactored Architecture

The backend has been restructured from a single-file prototype into a modular, production-grade API following enterprise standards:

```text
├── migrations/             # Database migrations managed by node-pg-migrate
│   ├── 1750000000000_init.sql          # Initial schema tables
│   └── 1782330186080_add-auth-fields.sql# Schema changes for Google OAuth and nullable passwords
├── src/
│   ├── __tests__/          # Integration tests (Vitest + Supertest)
│   │   ├── auth.test.ts    # Integration tests for signup, login, and profile
│   │   ├── notes.test.ts   # Protected notes CRUD tests
│   │   └── tasks.test.ts   # Protected tasks checklist tests
│   ├── db/
│   │   ├── index.ts        # pg-pool database client connection setup
│   │   └── seed.ts         # Database seed script for local demo data
│   ├── middleware/
│   │   ├── auth.ts         # JWT authentication & session extraction middleware
│   │   └── errorHandler.ts # Global express error and 404 handlers
│   ├── routes/             # Modular API controllers
│   │   ├── auth.ts         # JWT & Google OAuth registration / session routing
│   │   ├── health.ts       # Health check and DB-connectivity verification
│   │   ├── notes.ts        # Note CRUD routing (user-scoped)
│   │   └── tasks.ts        # Task CRUD routing (user-scoped)
│   ├── validation/
│   │   └── schemas.ts      # Zod validation schemas for requests and auth
│   ├── config.ts           # Global configuration and safety-first env validator
│   ├── app.ts              # Express application assembly (security & routers)
│   └── server.ts           # HTTP server startup entrypoint
├── tsconfig.json           # TypeScript compilation configurations
└── package.json            # Scripts, dependencies, and engines
```

---

## Features

- **Strict Configuration Validator (`src/config.ts`)**: Enforces environment safety. The server **refuses to start** in production if `JWT_SECRET` is missing, preventing insecure deployments.
- **Fail-Closed Google OAuth**: Google Sign-In strictly validates all credential tokens cryptographically against Google's public keys. If `GOOGLE_CLIENT_ID` is not configured, the route **fails closed** with a `503 Service Unavailable` error instead of permitting insecure/unverified access.
- **Brute-Force Abuse Prevention (`credentialLimiter`)**: Signups, logins, and Google OAuth attempts are protected by a strict rate limiter (maximum of 10 requests per 15 minutes per IP) to block brute-force and credential-stuffing attacks.
- **JWT Authentication**: Full-featured token-based session management using `jsonwebtoken` and `bcryptjs` for password hashing.
- **User Scoping**: Notes and tasks routes are locked down. The database queries automatically filter and mutate records specifically matching the authenticated user's ID (`req.user.id`), turning the app into a true multi-user platform.
- **Database Migrations**: Incremental, version-controlled schema changes using `node-pg-migrate` instead of ad-hoc scripts.
- **Robust Security**: Protected with `helmet` for HTTP headers and `cors` with domain whitelisting.
- **Abuse Protection**: Generous but bounded rate limiting via `express-rate-limit` (300 requests per 15 minutes) for general API endpoints.
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
JWT_SECRET=supersecretkeychangeinproduction
GOOGLE_CLIENT_ID=optional-your-google-client-id
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

## Authentication & API Endpoints

All application routes (except `/health` and `/api/auth/*`) require a valid JWT token passed in the header:
`Authorization: Bearer <your-jwt-token>`

### Auth Routes (`/api/auth`)
*   `POST /signup`: Registers a new user. Expects `{ email, password, displayName }` (protected by credential rate limiter).
*   `POST /login`: Logs in an existing user. Expects `{ email, password }` (protected by credential rate limiter).
*   `POST /google`: Authenticates a Google Identity credential token. Expects `{ credential }` (protected by credential rate limiter; requires `GOOGLE_CLIENT_ID`).
*   `GET /me`: Returns the profile of the currently authenticated user (requires token).

---

## Testing

The backend uses **Vitest** and **Supertest** to test routes. The database layer is mocked during testing, making the test suite completely independent of external dependencies.

Our tests fully cover:
- Zod request validations.
- Registration and login credential verification.
- Token generation and verification.
- User-scoped CRUD database logic.

### Run Tests
```bash
npm test
```
