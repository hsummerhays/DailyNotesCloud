# DailyNotesCloud - Frontend Client

This is the frontend client for DailyNotesCloud, built with **Next.js** (App Router), **TypeScript**, **Tailwind CSS v4**, and **Vitest**.

The client is designed to be **offline-first**: it automatically attempts to synchronize with the Express backend, but falls back seamlessly to an interactive local storage state if the API is offline.

---

## Core Authentication Architecture

We have implemented a secure, modern, and user-friendly authentication layer:

1.  **Auth Provider (`src/lib/AuthContext.tsx`)**:
    *   A React context wrapping the entire application to manage the active session state (`user`, `token`, `isAuthenticated`, `isLoading`).
    *   Saves session data securely in `localStorage` (`dailynotescloud_token`, `dailynotescloud_user`) to keep users logged in across page refreshes.
    *   Communicates with backend authentication endpoints (`/signup`, `/login`, `/google`, `/me`).
    *   Actively validates cached tokens with the backend on startup.
2.  **Auto-Token Injection (`src/lib/api.ts`)**:
    *   Our fetch request client dynamically reads `dailynotescloud_token` from `localStorage` in the browser and automatically attaches the `Authorization: Bearer <token>` header to all outgoing API calls.
    *   This eliminates the need to pass tokens down manually through individual page components or forms.
3.  **Authentication Portal (`src/components/AuthView.tsx`)**:
    *   A glassmorphic dark-theme login/registration card.
    *   Asynchronously mounts Google's official Identity Services client SDK script (`https://accounts.google.com/gsi/client`) and dynamically renders the native **"Sign in with Google"** button.
    *   Gracefully supports Email/Password authentication as a local fallback.
4.  **Offline-First Routing Bypass**:
    *   If the backend is connected (`backendStatus === "connected"`), the client strictly locks the dashboard behind the `<AuthView />` portal until the user logs in.
    *   If the backend is offline (`backendStatus === "offline"`), the client **gracefully bypasses the login barrier** and opens the dashboard in local-storage fallback mode, ensuring notes can still be created and reviewed offline.

---

## Code Structure

```text
├── src/
│   ├── app/
│   │   ├── globals.css         # Tailwind CSS imports and custom base styles
│   │   ├── layout.tsx          # Root layout wrapped in the AuthProvider
│   │   └── page.tsx            # Main page directing to AuthView or Dashboard
│   ├── components/             # Reusable UI components
│   │   ├── AuthView.tsx        # Sign-In, Sign-Up, and Google One Tap portal
│   │   ├── ErrorBanner.tsx     # Handles API connection warning banners
│   │   ├── NoteCard.tsx        # Individual Note display with delete controls
│   │   ├── NoteForm.tsx        # Form for creating new notes (with tag parser)
│   │   ├── StatusBadge.tsx     # Connection status indicator (Connected/Offline)
│   │   ├── TaskForm.tsx        # Quick-add form for checklist tasks
│   │   ├── TaskItem.tsx        # Task checklist item with toggle and delete
│   │   └── __tests__/          # Vitest component tests
│   │       ├── AuthView.test.tsx # Tests login/signup views, state, and errors
│   │       ├── NoteForm.test.tsx # Tests note creation and tag processing
│   │       ├── StatusBadge.test.tsx# Tests connection status rendering
│   │       └── TaskItem.test.tsx # Tests checklist checkbox toggles
│   └── lib/                    # Core service utilities
│       ├── api.ts              # Fetch-based API client with automatic JWT headers
│       ├── storage.ts          # LocalStorage fallback wrappers
│       ├── types.ts            # Shared TypeScript type definitions (User, Note, Task)
│       ├── AuthContext.tsx     # Auth context, Provider, and useAuth hook
│       └── __tests__/          # Vitest library unit tests
│           ├── AuthContext.test.tsx# Tests signup/login states and local storage persistence
│           └── storage.test.ts # Tests local storage helpers and fallbacks
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

---

## Testing

The frontend uses **Vitest** and **React Testing Library** for lightning-fast unit and component testing.

Our tests fully cover:
- React component renders and interactive behaviors.
- State management and API integration triggers.
- Form submissions, local storage caching, and error banner dismissals.

### Run Tests
```bash
npm test
```

### Watch Mode
```bash
npx vitest
```
