# Egyptian Student Housing Platform — Typography Specification

**Document ID**: `DES-TYP-001`  
**Version**: `1.0.0` (Milestone 1 — Discovery & Architecture)  
**Status**: `Approved Standard`  
**Target Applications**: `apps/web` (Next.js App Router), Shared UI Components  
**Primary Locale**: Egyptian Arabic (`ar-EG`, RTL) | **Secondary Locale**: English (`en-US`, LTR)

---

## 1. Font Family Architecture

The typography system is engineered specifically for clean bilingual harmony between Egyptian Arabic (RTL) and Latin/English (LTR).

```
+-----------------------------------------------------------------------------------------+
|                                    FONT SELECTION                                       |
+-------------------------------------+---------------------------------------------------+
| Arabic Script (Primary)             | Latin Script (Secondary / English)                |
+-------------------------------------+---------------------------------------------------+
| Display & Hero: Alexandria          | Display & Headings: Inter                         |
| (Geometric, modern, bold personality| (Neutral, hyper-legible, contemporary neo-grotesk) |
|                                     |                                                   |
| Body, UI & Subheadings: Cairo       | Body & UI: Inter                                  |
| (Open counters, wide dot separation,| (Consistent optical weight matching Cairo)        |
| clear diacritics at small sizes)    |                                                   |
|                                     | Monospace: JetBrains Mono / ui-monospace          |
+-------------------------------------+---------------------------------------------------+
```

### 1.1 Web Font Ingestion via `next/font/google`

Fonts are self-hosted and zero-layout-shift loaded directly through Next.js font optimization:

```typescript
// apps/web/src/lib/fonts.ts
import { Cairo, Alexandria, Inter } from 'next/font/google';

export const fontAlexandria = Alexandria({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-alexandria',
  display: 'swap',
});

export const fontCairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cairo',
  display: 'swap',
});

export const fontInter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});
```

### 1.2 System Fallback Stacks

If Google Fonts fail to load or are blocked on restricted networks:

- **Arabic Fallback**: `system-ui, -apple-system, "Segoe UI", Tahoma, Arial, sans-serif`
- **Latin Fallback**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
- **Monospace Fallback**: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace`

---

## 2. Complete Typographic Hierarchy Matrix

| Level              | Size (px / rem)     | Arabic Font & Weight            | English Font & Weight           | Line Height (AR / EN) | Letter Spacing (Tracking) | Primary Platform Use Case                                                    |
| ------------------ | ------------------- | ------------------------------- | ------------------------------- | --------------------- | ------------------------- | ---------------------------------------------------------------------------- |
| **Display**        | `48px` / `3.00rem`  | Alexandria Bold `700`           | Inter Bold `700`                | `1.30` / `1.15`       | AR: `0` / EN: `-0.025em`  | Hero landing headlines ("سكن طلابي موثوق بجوار جامعتك")                      |
| **Heading 1 (H1)** | `36px` / `2.25rem`  | Alexandria Bold `700`           | Inter Bold `700`                | `1.35` / `1.20`       | AR: `0` / EN: `-0.02em`   | Major page headings, property detail title, onboarding header                |
| **Heading 2 (H2)** | `28px` / `1.75rem`  | Alexandria SemiBold `600`       | Inter SemiBold `600`            | `1.40` / `1.25`       | AR: `0` / EN: `-0.015em`  | Section headers, modal titles (e.g., "طلب حجز سكن"), search drawer header    |
| **Heading 3 (H3)** | `22px` / `1.375rem` | Cairo SemiBold `600`            | Inter SemiBold `600`            | `1.45` / `1.30`       | AR: `0` / EN: `-0.01em`   | Property card price tag (`2,500 ج.م/شهر`), unit summary card, chat header    |
| **Heading 4 (H4)** | `18px` / `1.125rem` | Cairo SemiBold `600`            | Inter SemiBold `600`            | `1.50` / `1.35`       | AR: `0` / EN: `0`         | Sub-card headers, accordion titles, filter group labels                      |
| **Body Large**     | `18px` / `1.125rem` | Cairo Regular `400` / Med `500` | Inter Regular `400` / Med `500` | `1.65` / `1.50`       | AR: `0` / EN: `0`         | Introductory paragraphs, highlighted property descriptions                   |
| **Body Medium**    | `16px` / `1.00rem`  | Cairo Regular `400` / Med `500` | Inter Regular `400` / Med `500` | `1.60` / `1.50`       | AR: `0` / EN: `0`         | Standard body copy, form inputs, dropdown options, chat messages             |
| **Body Small**     | `14px` / `0.875rem` | Cairo Regular `400` / Med `500` | Inter Regular `400` / Med `500` | `1.55` / `1.45`       | AR: `0` / EN: `0.01em`    | Campus distance (`1.2 كم من جامعة القاهرة`), auxiliary metadata, helper text |
| **Caption**        | `12px` / `0.75rem`  | Cairo Medium `500` / Semi `600` | Inter Medium `500` / Semi `600` | `1.50` / `1.40`       | AR: `0` / EN: `0.02em`    | Verification status pill badges, timestamps, photo carousel index (`1/8`)    |
| **Code / Mono**    | `14px` / `0.875rem` | JetBrains Mono `500`            | JetBrains Mono `500`            | `1.50` / `1.50`       | `0`                       | Booking reference codes, OTP input fields, admin audit log IDs               |

---

## 3. Font Weights Breakdown

The platform enforces four standardized font weights:

| Weight Name   | Numeric Value | Usage in Arabic Interface                                   | Usage in English Interface                                |
| ------------- | ------------- | ----------------------------------------------------------- | --------------------------------------------------------- |
| **Regular**   | `400`         | Body descriptions, long-form terms, policy paragraphs       | Body descriptions, long-form terms, articles              |
| **Medium**    | `500`         | Form labels, input values, table data, filter options       | Form labels, input values, table cells, secondary actions |
| **Semi-Bold** | `600`         | Section headings, card titles, navigation links, buttons    | Section headings, card titles, navigation items, buttons  |
| **Bold**      | `700`         | Main titles (H1/Display), numerical prices, critical badges | Main titles (H1/Display), prices, critical alerts         |

---

## 4. Line Heights & Vertical Rhythm

### 4.1 The Arabic Vertical Span Difference

Arabic typography has distinctive vertical metrics:

- Arabic letters have ascenders (`أ`, `ل`, `ك`), descenders (`ي`, `ر`, `ع`), and crucial diacritics / dots (`ت`, `ث`, `ش`, `إ`, `ض`).
- Setting Latin-standard line heights (`1.2` or `1.3`) on Arabic text causes dot clipping and unreadable density.
- **Rule**: Arabic body copy must always have a line height of **1.55x to 1.65x**, whereas Latin body copy operates comfortably at **1.45x to 1.50x**.

```css
/* Automated line-height compensation based on root direction */
:root[dir='rtl'] {
  --line-height-body: 1.625;
  --line-height-heading: 1.375;
}

:root[dir='ltr'] {
  --line-height-body: 1.5;
  --line-height-heading: 1.25;
}
```

---

## 5. Letter Spacing (Tracking) Rules

### 5.1 The Arabic Tracking Prohibition

> **CRITICAL RULE**: Tracking / `letter-spacing` must NEVER be applied to Arabic text (`letter-spacing: 0` or `normal`).
> Applying positive letter spacing to cursive Arabic scripts breaks the connecting ligatures (_Kashida_ / cursive joins) between letters, creating fragmented, broken characters that look severely defective and unprofessional.

```css
/* Strictly enforce zero tracking on Arabic elements */
[dir='rtl'] h1,
[dir='rtl'] h2,
[dir='rtl'] h3,
[dir='rtl'] h4,
[dir='rtl'] p,
[dir='rtl'] span,
[dir='rtl'] input,
[dir='rtl'] button {
  letter-spacing: 0 !important;
}
```

---

## 6. RTL & Bilingual Typographic Pairing Rules

### 6.1 Baseline Optical Compensation

Alexandria and Cairo have slightly larger vertical ascender bounds compared to Inter at identical font sizes. When rendering mixed inline phrases (e.g., English university names inside an Arabic sentence), the browser baseline aligns naturally because both Cairo and Inter share aligned x-heights.

### 6.2 Numeral Presentation in Egyptian Platforms

- In contemporary Egyptian consumer and governmental web platforms (e.g., telecom, banking, ride-hailing), **Western Arabic numerals** (`0, 1, 2, 3, 4, 5, 6, 7, 8, 9`) are the accepted commercial standard for clarity in prices, phone numbers, and distances.
- **Formatting Standard**:
  - Currency representation in Arabic: `2,500 ج.م / شهرياً` (Number + space + currency abbreviation + slash + duration).
  - Currency representation in English: `2,500 EGP / month`.
  - Phone numbers: `+20 10 1234 5678` (Formatted with spaces, LTR isolated).

### 6.3 Bidirectional Text Isolation (`<bdi>` and `unicode-bidi`)

Phone numbers, email addresses, and codes inserted into Arabic text must be wrapped inside bidirectional isolation elements to prevent punctuation flipping:

```html
<!-- Correct Bidirectional Embedding -->
<p>
  تواصل مع المالك عبر الهاتف:
  <bdi class="font-mono text-brand-navy-900 dark:text-brand-navy-100">+20 10 9876 5432</bdi>
</p>
```

### 6.4 Hyphenation

- **Arabic**: Hyphenation is strictly forbidden and linguistically invalid. `hyphens: none` is globally enforced.
- **English**: `hyphens: manual` or `none` to prevent clumsy line-breaks in property cards.

---

## 7. CSS Custom Properties Implementation

```css
:root {
  /* Font Family Definitions */
  --font-family-display: var(--font-alexandria), var(--font-cairo), system-ui, sans-serif;
  --font-family-body: var(--font-cairo), var(--font-inter), system-ui, sans-serif;
  --font-family-latin: var(--font-inter), system-ui, sans-serif;
  --font-family-mono: 'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace;

  /* Typographic Scales */
  --text-display: 3rem; /* 48px */
  --text-h1: 2.25rem; /* 36px */
  --text-h2: 1.75rem; /* 28px */
  --text-h3: 1.375rem; /* 22px */
  --text-h4: 1.125rem; /* 18px */
  --text-body-lg: 1.125rem; /* 18px */
  --text-body-md: 1rem; /* 16px */
  --text-body-sm: 0.875rem; /* 14px */
  --text-caption: 0.75rem; /* 12px */

  /* Weight Tokens */
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}
```
