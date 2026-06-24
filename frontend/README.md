# DailyNotesCloud - Frontend Client

This is the frontend client for DailyNotesCloud, built with **Next.js** (App Router), **TypeScript**, **Tailwind CSS v4**, and **Vitest**.

The client is designed to be **offline-first**: it automatically attempts to synchronize with the Express backend, but falls back seamlessly to an interactive local storage state if the API is offline.

---

## Architecture & Code Structure

The client codebase is structured into highly modular components and service layers:

```text
├── src/
│   ├── app/
│   │   ├── globals.css         # Tailwind CSS imports and custom base styles
│   │   ├── layout.tsx          # Main application shell & fonts
│   │   └── page.tsx            # App container coordinating state and sync
│   ├── components/             # Reusable UI components
│   │   ├── ErrorBanner.tsx     # Handles API connection warning banners
│   │   ├── NoteCard.tsx        # Individual Note display with delete controls
│   │   ├── NoteForm.tsx        # Form for creating new notes (with tag parser)
│   │   ├── StatusBadge.tsx     # Connection status indicator (Connected/Offline)
│   │   ├── TaskForm.tsx        # Quick-add form for checklist tasks
│   │   ├── TaskItem.tsx        # Task checklist item with toggle and delete
│   │   └── __tests__/          # Vitest component tests
│   └── lib/                    # Core service utilities
│       ├── api.ts              # Fetch-based REST client for notes & tasks
│       ├── storage.ts          # LocalStorage fallback wrappers
│       ├── types.ts            # Shared TypeScript type definitions
│       └── __tests__/          # Service unit tests
├── vitest.config.ts            # Testing configuration
└── vitest.setup.ts             # React Testing Library configuration
```

---

## Development & Build Commands

Run these commands inside the `/frontend` directory:

### Development Server
Starts the hot-reloading development server on [http://localhost:3000](http://localhost:3000).
```bash
npm run dev
```

### Production Build
Compiles the TypeScript and bundles the Next.js application into highly optimized static and server-rendered outputs under `.next/`.
```bash
npm run build
```

### Run Production Server
Starts the built Next.js application in production mode.
```bash
npm run start
```

### Code Linting
Lints the code using ESLint. Note that due to upstream plugin constraints (`eslint-plugin-react` vs. ESLint 10), lint warnings do not block the build process.
```bash
npm run lint
```

---

## Testing

The frontend uses **Vitest** and **React Testing Library** for lightning-fast unit and component testing.

### Run Tests
```bash
npm test
```

### Watch Mode
```bash
npx vitest
```
