# ADR-002: Next.js App Router for Web Application with Bilingual Route Groups

- **Status**: **ACCEPTED**
- **Deciders**: Frontend Architecture Team, UI/UX Lead, Product Manager
- **Date**: 2026-11-20
- **Technical Story**: Phase 2 System Architecture & Frontend Monorepo Scaffolding
- **Source Specification**: `app.txt` Section 6 (Lines 577–585), Section 9 (Lines 506–538); `app2.txt` (Lines 14–77)

---

## 1. Context and Problem Statement

The Egyptian Student Housing Platform web application (`apps/web`) must satisfy diverse, mission-critical frontend requirements:

1. **Public Discoverability & SEO**: Prospective students search for housing using search engines (e.g., "سكن طلاب بجوار جامعة القاهرة", "student housing near AUC"). High SEO performance via server-rendered HTML and metadata is vital for organic acquisition in Egypt.
2. **Diverse Role-Specific User Experiences**: The platform serves four distinct personas: public visitors, university students, verified property providers, and platform superadministrators. Each role demands distinct navigation patterns, authentication gates, and dashboard layouts.
3. **Bilingual Egyptian Arabic (RTL) & English (LTR) Localization**: The primary language is Egyptian Arabic with right-to-left (RTL) reading order; English (LTR) is secondary. Switching languages must seamlessly mirror layouts without visual glitching or breaking form layouts.
4. **Mobile-First Responsiveness**: The vast majority of Egyptian students access web services via smartphones over mobile networks (3G/4G).

We evaluated frontend frameworks and routing architectures to meet these goals.

---

## 2. Decision Drivers

1. **Native Server-Side Rendering (SSR) & Static Generation (SSG)**: Immediate indexing of listing pages, university landing pages, and city guides by search engine web crawlers.
2. **Layout Segregation via Route Groups**: Ability to create isolated layouts for public, auth, student, owner, and admin areas without introducing unnecessary URL path segments.
3. **Robust Right-to-Left (RTL) Design System**: Clean bi-directional layout support using CSS logical properties without duplicate CSS stylesheets.
4. **Performance on Mobile Networks**: Minimize client-side JavaScript bundle sizes by leveraging React Server Components (RSC).

---

## 3. Considered Options

### Option 1: Client-Side Single-Page Application (Vite + React SPA)

- Pure client-side rendering.
- **Drawbacks**: Poor initial SEO indexing; slow First Contentful Paint (FCP) on mobile networks due to large initial JavaScript bundle downloads; requires complex third-party hydration setups for social sharing cards.

### Option 2: Next.js Pages Router (Legacy Architecture)

- Traditional Next.js `pages/` directory with `_app.tsx` and `_document.tsx`.
- **Drawbacks**: Lacks native nested layout support; complex custom layout state persistence; lacks modern React Server Components streaming; cumbersome dynamic locale routing with nested role layouts.

### Option 3: Next.js 14+ App Router with Dynamic Locale Route Segments (Selected)

- Next.js App Router utilizing the `src/app/[locale]/` directory hierarchy.
- Route groups: `(public)`, `(auth)`, `(student)`, `(owner)`, `(admin)`.
- Tailwind CSS with logical properties for bi-directional layout rendering.
- Cairo and Alexandria typography for Arabic; Inter for English.

---

## 4. Decision Outcome

**Chosen Option: Option 3 — Next.js 14+ App Router with Dynamic Locale Segments and Route Groups.**

We adopt Next.js App Router inside `apps/web`. All routes are nested under `src/app/[locale]/`, where `locale` dynamically matches supported languages (`ar` or `en`).

### Route Group Structure:

- `src/app/[locale]/(public)/`: Landing page, search (`/search`), property details (`/properties/[propertyId]`), about, contact.
- `src/app/[locale]/(auth)/`: Registration (`/register`), OTP verification (`/verify-otp`), login (`/login`), account type selection (`/account-type`).
- `src/app/[locale]/(student)/student/`: Student dashboard, booking requests (`/requests/[requestId]`), 1:1 chat (`/messages/[conversationId]`), reviews, notifications.
- `src/app/[locale]/(owner)/owner/`: Property provider dashboard, inventory management (`/properties/new`, `/properties/[propertyId]`), incoming requests, KYC verification submission.
- `src/app/[locale]/(admin)/admin/`: Superadmin dashboard, KYC inspection, property listing moderation, audit logs, marketplace analytics.

### Styling & Internationalization Strategy:

1. **Bi-directional Layout Control**: The root layout dynamically sets `<html lang="{locale}" dir="{locale === 'ar' ? 'rtl' : 'ltr'}">`.
2. **Tailwind CSS Logical Properties**: Styling strictly uses CSS logical properties (e.g., `ms-4`, `me-4`, `ps-6`, `pe-6`, `start-0`, `end-0`) rather than directional properties (`ml-`, `mr-`, `left-`, `right-`), ensuring automatic, flawless UI mirroring between Arabic and English.
3. **Typography**: Google Fonts loaded via `next/font`:
   - Primary Arabic: **Cairo** (headings and UI) and **Alexandria** (accents and clean body text).
   - Primary English: **Inter**.
4. **Color Palette**: Brand colors defined in Tailwind configuration:
   - Primary Energetic Accent: Orange (`#FF6B00` / `#FA5A00`).
   - Deep Stable Foundation: Navy (`#0A192F` / `#1E293B`).

---

## 5. Consequences & Trade-offs

### Positive Consequences

- **Maximum SEO Visibility**: All property listings and university guides are server-rendered with localized OpenGraph meta tags, ensuring top search rankings across Egypt.
- **Optimized Mobile Performance**: Static components execute on the server, streaming minimal JavaScript to students' mobile browsers.
- **Clean Code Organization**: Each user role operates within an isolated layout and feature domain, preventing leaked styling or permission logic.

### Negative Consequences & Mitigation

- **Server/Client Component Boundary Complexity**: Developers must explicitly designate `"use client"` for interactive elements (such as Google Maps, chat feeds, and form validation).
  _Mitigation_: Maintain a clear distinction: page wrappers and data fetchers remain Server Components, while UI controls in `src/components/` and `src/features/` are modular Client Components.
- **SSR Hydration Mismatch Risks**: Localized date formatting or direction tags can trigger hydration mismatches if not handled deterministically.
  _Mitigation_: Use unified date/number formatters in `src/lib/` with explicit locale passing.
