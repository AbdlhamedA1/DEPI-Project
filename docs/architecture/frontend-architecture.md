# Egyptian Student Housing Platform — Frontend Architecture Specification

**Document ID**: `ARCH-FE-001`  
**Version**: `1.0.0` (Phase 2 System Architecture)  
**Status**: `Approved Standard`  
**Target Application**: `apps/web` (Next.js App Router)  
**Primary Locale**: Egyptian Arabic (`ar`, RTL, default) | **Secondary Locale**: English (`en`, LTR)  
**Architectural Decision Records**: `ADR-002` (Next.js App Router Bilingual Architecture), `ADR-007` (Transparent Contact Disclosure)

---

## 1. Architectural Philosophy & Strategy

### 1.1 Core Principles

The frontend application (`apps/web`) is built with **Next.js 14 App Router**, **React 18**, **TypeScript**, and **Tailwind CSS**. It is structured to deliver an ultra-fast, accessible, and responsive user experience across Egyptian desktop and mobile devices.

Key tenets:

1. **Server-First Data Fetching**: Public landing pages, university discovery, and property listings utilize React Server Components (RSC) for maximum SEO performance, low client bundle size, and fast Initial Server Render (ISR/SSR).
2. **Client-Side Interactivity**: Highly dynamic experiences—such as the interactive Google Map search view, real-time messaging, multi-step listing wizard, and admin moderation queues—are encapsulated in isolated `'use client'` boundaries.
3. **Native Bi-Directionality (RTL/LTR)**: The interface treats Egyptian Arabic RTL as the primary citizen from the ground up, utilizing CSS Logical Properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`) to eliminate duplicate stylesheets.
4. **Separation of Concerns**: Pages are thin routing shells (`page.tsx`) that assemble feature components. Business logic, data queries, and mutations reside in feature modules and custom hooks, completely separate from page presentation.

---

## 2. Bilingual Routing & Middleware Architecture

### 2.1 Dynamic Locale Segment (`[locale]`)

All application routes are nested beneath the `src/app/[locale]/` dynamic segment. Supported locales are:

- `ar`: Egyptian Arabic (Default; `<html lang="ar" dir="rtl">`)
- `en`: English (`<html lang="en" dir="ltr">`)

### 2.2 Routing Flow & Middleware (`src/middleware.ts`)

The Edge Middleware (`src/middleware.ts`) executes on every incoming request, fulfilling three primary duties:

1. **Locale Negotiation & Redirection**:
   - Inspects the pathname for an existing locale prefix (`/ar` or `/en`).
   - If missing, checks for the `NEXT_LOCALE` cookie or parses the `Accept-Language` header (defaulting to `ar` for Egyptian traffic).
   - Issues an HTTP 307 redirect to `/${locale}${pathname}` preserving query parameters.
2. **Authentication Guards**:
   - Inspects the session JWT access token and refresh token stored in secure cookies.
   - Unauthenticated requests to protected portals (`/(student)/student/*`, `/(owner)/owner/*`, `/(admin)/admin/*`) are redirected to `/${locale}/login?redirect=${encodeURIComponent(pathname)}`.
3. **Role Escalation Prevention**:
   - Asserts that the decoded user role strictly matches the portal scope:
     - Route `/student/*` requires `role === 'STUDENT'`.
     - Route `/owner/*` requires `role === 'OWNER'`.
     - Route `/admin/*` requires `role === 'ADMIN'`.
   - Unauthorized attempts receive an immediate HTTP 303 redirect to their respective home dashboard or an access-denied screen.

```typescript
// Architectural Blueprint: src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SUPPORTED_LOCALES = ['ar', 'en'];
const DEFAULT_LOCALE = 'ar';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Static asset and internal API bypass
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // 2. Locale prefix detection & negotiation
  const pathnameHasLocale = SUPPORTED_LOCALES.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  if (!pathnameHasLocale) {
    const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
    const locale = SUPPORTED_LOCALES.includes(cookieLocale || '') ? cookieLocale : DEFAULT_LOCALE;
    const redirectUrl = new URL(`/${locale}${pathname}`, request.url);
    redirectUrl.search = request.nextUrl.search;
    return NextResponse.redirect(redirectUrl);
  }

  // 3. Extract locale and normalized path
  const currentLocale = pathname.split('/')[1];
  const subPath = pathname.replace(`/${currentLocale}`, '') || '/';

  // 4. Authentication and Role verification
  const token = request.cookies.get('auth_token')?.value;
  const userRole = request.cookies.get('user_role')?.value; // Verified by signature

  const isStudentRoute = subPath.startsWith('/student');
  const isOwnerRoute = subPath.startsWith('/owner');
  const isAdminRoute = subPath.startsWith('/admin');

  if (isStudentRoute || isOwnerRoute || isAdminRoute) {
    if (!token) {
      const loginUrl = new URL(`/${currentLocale}/login`, request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (isStudentRoute && userRole !== 'STUDENT') {
      return NextResponse.redirect(new URL(`/${currentLocale}/`, request.url));
    }
    if (isOwnerRoute && userRole !== 'OWNER') {
      return NextResponse.redirect(new URL(`/${currentLocale}/`, request.url));
    }
    if (isAdminRoute && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL(`/${currentLocale}/`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

---

## 3. Route Groups & Page Hierarchy (Per `app2.txt`)

The Next.js App Router topology directly implements the directory layout specified in `app2.txt`:

```
src/app/[locale]/
├── (public)/                               # Public unauthenticated routes
│   ├── page.tsx                           # Landing page (hero search, stats, university quick-select)
│   ├── search/
│   │   └── page.tsx                       # Dual-view search (synchronized cards + Google Map)
│   ├── properties/
│   │   └── [propertyId]/
│   │       └── page.tsx                   # Property details (hierarchy, photos, expenses, map, owner card)
│   ├── about/
│   │   └── page.tsx                       # Platform mission, trust & safety transparency
│   ├── contact/
│   │   └── page.tsx                       # Contact form & student support hotline
│   └── not-found.tsx                      # Localized 404 handler
│
├── (auth)/                                 # Onboarding and identity verification
│   ├── login/
│   │   └── page.tsx                       # Phone input (+20 format) & role login
│   ├── register/
│   │   └── page.tsx                       # Registration form (Student vs Provider selection)
│   ├── verify-otp/
│   │   └── page.tsx                       # 6-digit OTP verification with countdown timer
│   └── account-type/
│       └── page.tsx                       # Provider subtype selection (Individual Owner / Agent / Company)
│
├── (student)/student/                      # Authenticated Student Portal
│   ├── dashboard/
│   │   └── page.tsx                       # Request statuses, active viewings, saved preferences
│   ├── profile/
│   │   └── page.tsx                       # Student profile & verified university affiliation
│   ├── requests/
│   │   └── [requestId]/
│   │       └── page.tsx                   # Request status timeline, owner contact disclosure, confirmation trigger
│   ├── messages/
│   │   └── [conversationId]/
│   │       └── page.tsx                   # Real-time chat thread tied to booking request
│   ├── notifications/
│   │   └── page.tsx                       # In-app notification feed with mark-as-read
│   ├── reviews/
│   │   └── page.tsx                       # Post-confirmation review submission form (1-5 stars)
│   ├── reports/
│   │   └── page.tsx                       # Complaint submission (fraud, misrepresentation)
│   └── settings/
│       └── page.tsx                       # Phone update with OTP, locale toggle, preferences
│
├── (owner)/owner/                          # Authenticated Property Provider Portal
│   ├── dashboard/
│   │   └── page.tsx                       # Portfolio occupancy KPIs, request count, revenue overview
│   ├── profile/
│   │   └── page.tsx                       # Business profile, contact information
│   ├── properties/
│   │   ├── page.tsx                       # Property portfolio with moderation badges (PENDING, APPROVED)
│   │   ├── new/
│   │   │   └── page.tsx                   # Multi-step creation wizard (Building/Unit/Room/Bed hierarchy)
│   │   └── [propertyId]/
│   │       └── page.tsx                   # Edit listing, partial availability toggle, capacity management
│   ├── requests/
│   │   └── [requestId]/
│   │       └── page.tsx                   # Incoming request review, student contact card, Accept/Reject actions
│   ├── messages/
│   │   └── [conversationId]/
│   │       └── page.tsx                   # Real-time messaging with requesting student
│   ├── notifications/
│   │   └── page.tsx                       # Provider alerts (new requests, verification status updates)
│   ├── verification/
│   │   └── page.tsx                       # KYC document portal (National ID, title deeds, power of attorney)
│   └── settings/
│       └── page.tsx                       # Provider account settings & notifications configuration
│
└── (admin)/admin/                          # Platform Governance & Operations Portal
    ├── dashboard/
    │   └── page.tsx                       # Platform health, supply/demand KPIs, pending moderation queues
    ├── users/
    │   └── page.tsx                       # System-wide user registry and role management
    ├── students/
    │   └── page.tsx                       # Student registry and enrollment verification
    ├── owners/
    │   └── page.tsx                       # Provider management and compliance status
    ├── verifications/
    │   └── page.tsx                       # Provider KYC moderation queue with secure document preview
    ├── properties/
    │   └── page.tsx                       # Property listing moderation queue (Approve, Reject with reasons)
    ├── booking-requests/
    │   └── page.tsx                       # Global booking requests registry and dispute overview
    ├── reviews/
    │   └── page.tsx                       # User review moderation and reporting queue
    ├── reports/
    │   └── page.tsx                       # Abuse/fraud complaint triage and progressive resolution workflow
    ├── notifications/
    │   └── page.tsx                       # System-wide announcement broadcaster
    ├── analytics/
    │   └── page.tsx                       # Spatial analytics, price trends per governorate/university
    ├── audit-logs/
    │   └── page.tsx                       # Immutable AdminActionLog viewer with JSON state diffs
    └── settings/
        └── page.tsx                       # Platform settings (maintenance mode, governorate pilot flags)
```

---

## 4. Component Hierarchy & Atomic Design

The frontend codebase separates generic presentation primitives from domain-specific business features:

```
apps/web/src/
├── components/                            # Domain-Agnostic UI Primitives
│   ├── ui/                                # Atomic design system elements (Button, Input, Badge, Dialog, Dropdown, Skeleton, Tabs)
│   ├── layout/                            # Application shells (Header, Footer, Sidebar, Container, Grid)
│   ├── navigation/                        # Navigation controls (StudentNavbar, OwnerNavbar, AdminNavbar, Breadcrumbs)
│   ├── forms/                             # Controlled form inputs (PhoneInput, OtpInput, CurrencyInput, ImageUploader)
│   ├── feedback/                          # Feedback elements (Toast, Alert, EmptyState, Spinner, Modal)
│   ├── data-display/                      # Data renderers (PropertyCard, UnitRow, BedBadge, RequestStatusTimeline, AuditDiffViewer)
│   └── maps/                              # Spatial components (GoogleMapContainer, PropertyMarker, CampusBoundaryOverlay)
│
└── features/                              # Domain-Specific Feature Modules
    ├── auth/                              # Phone OTP login, registration forms, role selection
    ├── students/                          # Student profile editors, university affiliation pickers
    ├── owners/                            # Provider company profiles, contact cards
    ├── properties/                        # Multi-step creation wizard, image sorter, amenities selector
    ├── units/                             # Unit/Room/Bed hierarchical inventory manager
    ├── search/                            # Search bar, filter drawer, spatial distance calculators
    ├── booking-requests/                  # Request submission modal, status timeline, action buttons
    ├── agreements/                        # Agreement confirmation dialog, contract viewer
    ├── messaging/                         # Chat window, message bubbles, unread badge indicators
    ├── notifications/                     # Dropdown notification center, feed items
    ├── reviews/                           # 5-star rating widget, review cards, owner reply form
    ├── reports/                           # Report submission dialog, progressive status badge
    ├── verification/                      # Secure KYC upload form, document status monitor
    └── admin/                             # Moderation tables, diff viewers, analytics charts
```

---

## 5. State Management & Data Synchronization

The platform establishes a strict demarcation between Server State, Client UI State, and Form State:

```
+--------------------------------------------------------------------------------+
| DATA ARCHITECTURE LAYERS                                                       |
+--------------------------------------------------------------------------------+
| 1. Server State (TanStack Query v5)                                            |
|    - Caching, background refetching, optimistic updates, query invalidation    |
|    - Query Keys: ['properties', id], ['booking-requests', 'student', filter]   |
+--------------------------------------------------------------------------------+
| 2. Client UI & Session State (Zustand)                                         |
|    - Auth session token, active user role, search filter drawers, mobile nav   |
|    - Persistence: localStorage / secure cookies                                |
+--------------------------------------------------------------------------------+
| 3. Form State & Schema Validation (React Hook Form + Zod)                      |
|    - High-performance uncontrolled inputs with controlled error handling       |
|    - Runtime schemas imported directly from `packages/validation`              |
+--------------------------------------------------------------------------------+
```

### 5.1 Server State via TanStack Query v5

- **Query Key Discipline**: Query keys are strictly structured as arrays with domain namespaces:
  ```typescript
  export const propertyKeys = {
    all: ['properties'] as const,
    lists: () => [...propertyKeys.all, 'list'] as const,
    list: (filters: PropertyFilters) => [...propertyKeys.lists(), filters] as const,
    details: () => [...propertyKeys.all, 'detail'] as const,
    detail: (id: string) => [...propertyKeys.details(), id] as const,
  };
  ```
- **Mutation Invalidation**: Mutating operations invalidate relevant query caches. For instance, accepting a booking request invalidates `['booking-requests']`, `['availability']`, and `['conversations']`.

### 5.2 Client Session State via Zustand

Zustand provides a minimal, boilerplate-free global store for lightweight UI states:

- `useAuthStore`: Decoded user identity, active role, authentication status.
- `useSearchStore`: Active search filters (price range, governorate, university, gender rule, accommodation type).
- `useUIStore`: Mobile navigation drawer status, theme toggle (`light`/`dark`), active locale.

---

## 6. Design System & Styling Architecture

### 6.1 Tailwind CSS & Logical Properties

The platform styling enforces CSS Logical Properties to ensure 100% fidelity across Arabic (RTL) and English (LTR) layouts without code duplication.

```typescript
// tailwind.config.ts tokens extract
export default {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#FF6B00', // Core Startup Orange
          600: '#E05E00',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        navy: {
          50: '#F0F4F8',
          100: '#D9E2EC',
          200: '#BCCCDC',
          800: '#112240',
          900: '#0A192F', // Deep Trust Navy
        },
        status: {
          available: '#10B981',
          pending: '#F59E0B',
          booked: '#EF4444',
          maintenance: '#6B7280',
        },
      },
      fontFamily: {
        arabic: ['var(--font-cairo)', 'sans-serif'],
        english: ['var(--font-inter)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

### 6.2 Typography Strategy

- **Egyptian Arabic (`ar`)**: `Cairo` font (Google Fonts), optimized for Arabic ligatures, high legibility on mobile screens, and clean numerals.
- **English (`en`)**: `Inter` font, providing crisp, modern Latin typography.
- Fonts are loaded via `next/font/google` with zero layout shift (`display: swap`).
