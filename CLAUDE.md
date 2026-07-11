# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Web portal for **Yayasan Pondok Pesantren Miftahussalam Sleman** (YPPMS), an Islamic
boarding school foundation. It is a **thin frontend**: all business logic and data live in
a separate backend API (`NEXT_PUBLIC_API_BASE_URL`, default `http://localhost:3410`). This
repo renders UI and calls that API — there is no database, ORM, or server-side data layer
here. Currently the only implemented product area is **Kindy** (kindergarten), with separate
`student` and `admin` portals.

## Commands

```bash
npm run dev      # start Next.js dev server
npm run build    # production build
npm run start    # serve production build
npm run lint     # eslint (next/core-web-vitals)
```

There is no test suite. Verify changes by running `npm run dev` and exercising the flow, or
`npm run build` to catch type errors (TypeScript is `strict` with `noEmit`).

## Architecture

- **Next.js 15 App Router + React 19**, TypeScript, Tailwind + **shadcn/ui** for all styling
  (daisyUI was removed in the 2026-07 redesign).
- **Client-heavy**: pages are `"use client"`. Data is fetched in `useEffect` on the client,
  not in server components. Route entry pages (`page.tsx`) wrap a `PageContent` component in
  `<Suspense>`; that content component handles auth, then renders a `dashboard.tsx`.
- **Mobile-first**: the root layout ([src/app/layout.tsx](src/app/layout.tsx)) constrains all
  content to `max-w-[425px]`. Design for a phone-width column.
- Path alias `@/*` → `src/*`.

### API layer — [src/lib/api.ts](src/lib/api.ts)

All backend access goes through `apiCall()` and the grouped endpoint objects
(`kindyStudentApi`, `kindyAdminApi`, `orgApi`). When adding a backend call, add a method to
the relevant group rather than calling `fetch` directly.

- Every request sends `credentials: 'include'` — **auth is cookie-based JWT** set by the
  backend; there are no tokens in JS/localStorage.
- Non-2xx responses throw `ApiError` (with `.status`). Callers catch and surface `.message`.
- FormData uploads (e.g. `confirmPayment`) pass `headers: {}` to drop the JSON Content-Type.
- Shared response shape is `ApiResponse<T>` (`{ status, data, message, meta }`).

### Auth patterns (no auth library — done inline in `PageContent`)

- **Student** ([KindyStudentPageContent.tsx](src/app/kindy/student/KindyStudentPageContent.tsx)):
  entry via a `?stamp=` URL param → `login(stamp)` sets the cookie → the stamp param is
  stripped from the URL. On return visits (no stamp) it probes `getProfile()` to check the
  existing cookie.
- **Admin** ([KindyAdminPageContent.tsx](src/app/kindy/admin/KindyAdminPageContent.tsx)):
  password form → `login()`. Existing session is probed by calling a protected endpoint.
- Both first call `orgApi.ping()` as a server-health gate before checking auth.
- **Admin section authorization is endpoint-probe based**: [dashboard.tsx](src/app/kindy/admin/dashboard.tsx)
  calls `checkEndpointAccess()` against each section's endpoint in parallel and only shows
  tabs the current admin can hit (200 = allowed, 401/403 = hidden). Adding an admin section
  means adding a `{ key, endpoint }` entry to `allSections` plus a `*Section` component.

### Types — [src/lib/types.ts](src/lib/types.ts)

Mirror the backend response models (note the PascalCase nested relation fields like
`KindyEnrollment`, `KindyGroup` — these come straight from the backend/Prisma shape). Keep
these in sync with the API; they are not generated.

### Formatting — [src/lib/utils.ts](src/lib/utils.ts)

`formatCurrency` (→ `Rp` + Indonesian grouping) and `formatDate` (Indonesian month
abbreviations, `d-Mmm-yy`). Use these for all money and dates — the audience is Indonesian.

## Styling conventions

- Use **shadcn/ui** components from [src/components/ui](src/components/ui) (`Button`, `Card`,
  `Badge`, `Dialog`, `Input`, `Tabs`, `Switch`, `Table`, `Chip`, …) plus Tailwind utilities.
  Avoid hand-rolled CSS. See [src/components/ui/README.md](src/components/ui/README.md).
- Theming is **CSS variables** on `:root` / `.dark` in [globals.css](src/app/globals.css),
  mapped to semantic Tailwind tokens (`bg-card`, `text-foreground`, `text-muted-foreground`,
  `bg-muted`, `border-border`, `text-primary`, `bg-primary-soft`, `text-destructive`,
  `text-warning`, `text-info`, `*-soft`). Brand green primary `#16a34a`/`#22c55e`. **Never**
  use daisyUI classes (`btn`, `card`, `bg-base-*`, `text-base-content`, `modal`, `badge-*`)
  or raw palette utilities.
- **Light + dark mode**: the `dark` class on `<html>` (`darkMode: "class"`), persisted to
  `localStorage['yppms-theme']`, toggled by [ThemeToggle](src/components/ThemeToggle.tsx);
  a no-FOUC inline script in [layout.tsx](src/app/layout.tsx) applies it before paint.
- Fonts: **Geist** (UI) + **Geist Mono** (all money/account numbers/phones/IDs — `font-mono`).
- Loading state is `<Spinner />`; errors render via `<ErrorAlert message={...} />`. All modals
  are React-state shadcn `Dialog`/`AlertDialog` (no `document.getElementById().showModal()`).

## Environment & config

- `.env.local` sets `NEXT_PUBLIC_API_BASE_URL`. Point it at localhost or the dev backend
  (`https://dev-srv.miftahussalam.or.id`, commented alternative).
- [next.config.js](next.config.js): CORS headers + `allowedDevOrigins` are scoped to the
  Cloudflare tunnel domain `dev-web.miftahussalam.or.id`; images are only allowed from
  `yppms.blob.core.windows.net`. The whole site is `noindex, nofollow` (internal portal).
- `.mcp.json` wires an `org-server` filesystem MCP rooted at `$ORG_SERVER_PATH` (a sibling
  repo, presumably the backend) for cross-repo reference.
