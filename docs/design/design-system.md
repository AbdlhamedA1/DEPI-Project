# Egyptian Student Housing Platform — Design System Specification

**Document ID**: `DES-SYS-001`  
**Version**: `1.0.0` (Milestone 1 — Discovery & Architecture)  
**Status**: `Approved Standard`  
**Target Applications**: `apps/web` (Next.js App Router), Shared Component Library  
**Primary Language**: Egyptian Arabic (`ar-EG`, RTL) | **Secondary Language**: English (`en-US`, LTR)

---

## 1. Design Philosophy & Brand Direction

### 1.1 Core Vision

The Egyptian Student Housing Platform (**منصة سكن الطلاب في مصر**) bridges the gap between university students seeking transparent, reliable, and proximate accommodations and verified property providers (owners, authorized managers, and property companies) offering verified units, rooms, and individual beds across Egyptian university cities.

The visual language balances two complementary emotional postures:

1. **Student Vitality & Accessibility**: Energetic, youthful, transparent, and frictionless on mobile screens.
2. **Institutional Trust & Security**: Authoritative, robust, safe, and serious—reassuring Egyptian parents, property owners, and university administrations.

### 1.2 Anti-Patterns & Aesthetic Boundaries (Per `app.txt §5.17`)

- **No Generic "AI Template" Aesthetics**: Avoid random decorative geometric blobs, floating pastel gradients, and meaningless ornamental illustrations.
- **No Excessive Glassmorphism**: Forbid layered semi-transparent frosted blur backgrounds (`backdrop-blur-3xl`) that degrade CPU/GPU performance on budget Android devices common among Egyptian students.
- **No Emoji-Driven Interfaces**: Forbid using emoji characters as functional icons or navigation elements. All UI controls use crisp, professional SVG iconography (Lucide).
- **Substance Over Decoration**: Every visual element serves an operational purpose: communicating price per duration unit, bed availability, campus distance, verification integrity, or transactional status.

### 1.3 Target Audience Ergonomics

- **Mobile-First Realities**: 85%+ of student traffic is anticipated on mobile smartphones (iOS & Android) operating over Egyptian 4G/3G mobile networks. Pages must be lightweight, touch targets must be generous (≥44px), and critical info must be legible under bright daylight outdoor conditions.
- **Dual Portal Atmosphere**:
  - _Public & Student Portal_: Lightweight, fast, high-density listing cards, clear map controls, intuitive booking request flows.
  - _Owner & Admin Dashboard_: Fast internal web application feel with dense tabular data, audit timelines, verification document viewers, and clear toggle controls.

---

## 2. Directionality & Bilingual Foundations (RTL & LTR)

The platform is strictly bi-directional from Day 1. Egyptian Arabic (`ar`, RTL) is the primary default locale; English (`en`, LTR) is fully supported with seamless on-the-fly toggling.

```
+----------------------------------------------------------------------------+
| RTL (Egyptian Arabic)                                                      |
| [الشعار]          [عن المنصة]  [العقارات]  [الجامعات]         [دخول] [تسجيل] [EN] |
| <-- Start (Right)                                         End (Left) -->   |
+----------------------------------------------------------------------------+
| LTR (English)                                                              |
| [Logo]            [About]  [Properties]  [Universities]       [Login] [Sign Up] [عربي] |
| <-- Start (Left)                                         End (Right) -->   |
+----------------------------------------------------------------------------+
```

### 2.1 CSS Logical Properties Mandate

To ensure zero duplicate stylesheets between RTL and LTR, all layout styling must employ **CSS Logical Properties** rather than physical directions:

| Physical Property (Forbidden)    | Logical Replacement (Mandatory)               | Tailwind Logical Utility    |
| -------------------------------- | --------------------------------------------- | --------------------------- |
| `margin-left` / `margin-right`   | `margin-inline-start` / `margin-inline-end`   | `ms-*` / `me-*`             |
| `padding-left` / `padding-right` | `padding-inline-start` / `padding-inline-end` | `ps-*` / `pe-*`             |
| `left` / `right`                 | `inset-inline-start` / `inset-inline-end`     | `start-*` / `end-*`         |
| `border-left` / `border-right`   | `border-inline-start` / `border-inline-end`   | `border-s-*` / `border-e-*` |
| `text-align: left / right`       | `text-align: start / end`                     | `text-start` / `text-end`   |
| `border-top-left-radius`         | `border-start-start-radius`                   | `rounded-ss-*`              |
| `border-bottom-right-radius`     | `border-end-end-radius`                       | `rounded-ee-*`              |

### 2.2 Iconography Mirroring Protocol

Icons fall into two strict behavioral categories across language toggles:

1. **Directional Icons (Must Mirror in RTL)**:
   - Chevrons & Arrows (`ChevronRight`, `ChevronLeft`, `ArrowRight`, `ArrowLeft`)
   - Pagination controls (Previous / Next)
   - Back navigation buttons
   - Undo / Redo triggers
   - Breadcrumb separators
   - Implementation: `<Icon className="rtl:rotate-180" />` or `transform -scale-x-100`

2. **Universal / Semantic Icons (Never Mirror in RTL)**:
   - Branding marks & Logos
   - Phone (`Phone`, `PhoneCall`), Email (`Mail`), WhatsApp
   - Search (`Search`), Magnifying glass
   - Location pins (`MapPin`), University graduation cap (`GraduationCap`)
   - Bed (`Bed`), Building (`Building2`), Home (`Home`)
   - Calendar (`Calendar`), Clock (`Clock`), Timer (`Timer`)
   - Checkmark (`Check`, `CheckCircle`), Close / X (`X`, `XCircle`)
   - Heart, Star, Warning triangle, Shield verification badge

---

## 3. The 8-Point Grid System & Layout Principles

### 3.1 Base Mathematical Unit

The platform layout is built upon an uncompromising **8-point grid** (`8px`). All layout dimensions, column gutters, margins, component heights, and structural vertical rhythms must be multiples of 8.

- **Base Grid**: `8px`
- **Sub-Grid (Micro-step)**: `4px` (Permitted exclusively for icon-to-label spacing, compact table cell padding, and badge internal padding).

```
 4px  [Micro]   - Badges, tight inline tags, icon padding
 8px  [Base]    - Card inner padding, list item gaps, small buttons
16px  [Double]  - Standard component gap, form field vertical spacing
24px  [Triple]  - Card margins, modal content padding, section spacing
32px  [Quad]    - Page section headers, drawer margins
48px  [x6]      - Major block separation, hero padding
64px  [x8]      - Landing section vertical separation
```

### 3.2 Responsive Screen Breakpoints

Standardized around the Next.js and Tailwind screen matrix, optimized for real Egyptian mobile and desktop viewports:

| Breakpoint | Minimum Width | Target Devices in Egypt                               | Container Max Width | Typical Gutter |
| ---------- | ------------- | ----------------------------------------------------- | ------------------- | -------------- |
| `xs`       | `375px`       | iPhone SE, compact Galaxy A-series                    | `100%`              | `16px`         |
| `sm`       | `640px`       | Large phones (iPhone 14/15, Galaxy S/Plus)            | `100%`              | `16px`         |
| `md`       | `768px`       | iPads, small Android tablets, foldable phones         | `720px`             | `24px`         |
| `lg`       | `1024px`      | Laptops, desktop monitors, landscape tablets          | `960px`             | `32px`         |
| `xl`       | `1280px`      | High-res laptops, desktop displays                    | `1200px`            | `32px`         |
| `2xl`      | `1536px`      | Ultrawide monitors, large administrative workstations | `1440px`            | `40px`         |

---

## 4. Spacing System Tokens

Spacing tokens provide mathematical consistency across engineering teams.

```css
:root {
  --spacing-0: 0px;
  --spacing-1: 0.25rem; /*  4px - Sub-grid micro */
  --spacing-2: 0.5rem; /*  8px - Base unit */
  --spacing-3: 0.75rem; /* 12px - Intermediate */
  --spacing-4: 1rem; /* 16px - Form gaps, card padding */
  --spacing-5: 1.25rem; /* 20px - Medium container */
  --spacing-6: 1.5rem; /* 24px - Section gaps */
  --spacing-8: 2rem; /* 32px - Module margin */
  --spacing-10: 2.5rem; /* 40px - Large container */
  --spacing-12: 3rem; /* 48px - Section breaks */
  --spacing-16: 4rem; /* 64px - Landing block dividers */
  --spacing-20: 5rem; /* 80px - Hero layout separation */
}
```

---

## 5. Elevation, Surface Hierarchy & Shadows

The platform uses a disciplined, understated shadow system. Surfaces are primarily distinguished through crisp border strokes (`1px border-slate-200` in light mode; `1px border-slate-800` in dark mode) paired with subtle, natural elevation:

```
+--------------------------------------------------------------------------+
| Level 0: Background Surface (Flat)                                       |
| bg-slate-50 (Light) / bg-slate-950 (Dark)                                |
|   +--------------------------------------------------------------------+ |
|   | Level 1: Surface Card / Panel (Elevation: Low)                     | |
|   | bg-white / bg-slate-900 | shadow-sm | border border-slate-200       | |
|   |   +--------------------------------------------------------------+ | |
|   |   | Level 2: Interactive Element / Hover / Dropdown              | | |
|   |   | shadow-md | border border-slate-300                          | | |
|   |   +--------------------------------------------------------------+ | |
|   +--------------------------------------------------------------------+ |
|                                                                          |
| Level 3: Sticky Bars / Bottom Navigation (shadow-lg)                     |
| Level 4: Modals / Sliding Filter Drawers (shadow-xl + backdrop)          |
| Level 5: Toast Notifications / Overlays (shadow-2xl)                     |
+--------------------------------------------------------------------------+
```

### 5.1 Elevation Token Definitions

```css
:root {
  /* Level 0: Pure canvas / page body */
  --elevation-0: none;

  /* Level 1: Cards, list items, subtle containers */
  --shadow-level-1: 0 1px 2px 0 rgba(10, 25, 47, 0.05);

  /* Level 2: Dropdowns, popovers, active search filters, card hover */
  --shadow-level-2: 0 4px 6px -1px rgba(10, 25, 47, 0.08), 0 2px 4px -2px rgba(10, 25, 47, 0.05);

  /* Level 3: Sticky navigation bars, floating map toggles */
  --shadow-level-3: 0 10px 15px -3px rgba(10, 25, 47, 0.08), 0 4px 6px -4px rgba(10, 25, 47, 0.04);

  /* Level 4: Dialogs, Booking Request Modal, Mobile Filter Drawer */
  --shadow-level-4: 0 20px 25px -5px rgba(10, 25, 47, 0.12), 0 8px 10px -6px rgba(10, 25, 47, 0.06);

  /* Level 5: Global alert banners, Floating quick action buttons */
  --shadow-level-5: 0 25px 50px -12px rgba(10, 25, 47, 0.2);
}

/* Dark Mode Shadow Overrides: Increased opacity and tinted ambient ring */
.dark {
  --shadow-level-1: 0 1px 2px 0 rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
  --shadow-level-2: 0 4px 6px -1px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.07);
  --shadow-level-3: 0 10px 15px -3px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08);
  --shadow-level-4: 0 20px 25px -5px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1);
  --shadow-level-5: 0 25px 50px -12px rgba(0, 0, 0, 0.9);
}
```

---

## 6. Border Radii & Shape System

Geometry emphasizes precision, security, and approachability without feeling childish or toy-like.

| Token         | Value    | Tailwind Class | Usage Scope                                                  |
| ------------- | -------- | -------------- | ------------------------------------------------------------ |
| `radius-none` | `0px`    | `rounded-none` | Full-width banners, edge-to-edge mobile drawers              |
| `radius-xs`   | `2px`    | `rounded-xs`   | Table row check indicators, fine tags                        |
| `radius-sm`   | `4px`    | `rounded-sm`   | Tooltips, code chips, micro status dots                      |
| `radius-md`   | `8px`    | `rounded-md`   | Input fields, textareas, standard action buttons             |
| `radius-lg`   | `12px`   | `rounded-lg`   | Dropdown menus, property card thumbnails, tabs               |
| `radius-xl`   | `16px`   | `rounded-xl`   | Property cards, containers, summary panels                   |
| `radius-2xl`  | `24px`   | `rounded-2xl`  | Modal dialogs, floating action sheets                        |
| `radius-full` | `9999px` | `rounded-full` | Avatar circles, verification badges, pill tags, filter chips |

---

## 7. Motion & Transition Guidelines

Animations must feel snappy, decisive, and lightweight. Over-animated pages cause battery drain and frustration during urgent apartment hunting.

### 7.1 Timing Tokens

- **Instant (`fast` - 100ms)**: Checkboxes, toggle switches, radio selects.
- **Micro-Interaction (`base` - 200ms)**: Button hover, card scale hover, dropdown appearance, tab change.
- **Structural Movement (`slow` - 300ms)**: Drawer slide-in, modal fade & scale, accordion expand/collapse, mobile filter sheet.
- **Max Animation Limit**: No UI animation shall exceed `350ms`.

### 7.2 Easing Curves

```css
:root {
  /* Standard transition curve for general UI states */
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);

  /* Deceleration curve for elements entering the screen */
  --ease-enter: cubic-bezier(0, 0, 0.2, 1);

  /* Acceleration curve for elements exiting the screen */
  --ease-exit: cubic-bezier(0.4, 0, 1, 1);
}
```

### 7.3 Accessibility & Reduced Motion

In strict accordance with WCAG Guideline 2.3.3:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  ::before,
  ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 8. Touch Targets & Ergonomic Standards

- **Minimum Touch Target**: `44px x 44px` on all touch-enabled viewports (`<1024px`).
- **Touch Target Padding**: Elements visually styled at 32px or 36px (e.g., carousel next/previous buttons, map zoom triggers, icon buttons) must include a transparent pseudo-element (`::after`) or outer touch wrapper extending hit bounds to at least `44px`.
- **Bottom Navigation Safe Area**: On iOS devices with home indicators, all bottom bars and mobile sheets must incorporate `env(safe-area-inset-bottom)`.

---

## 9. Accessibility Compliance (WCAG 2.1 AA)

1. **Color Contrast**:
   - Minimum `4.5:1` contrast ratio for normal body text (`<18pt` or `<14pt bold`).
   - Minimum `3.0:1` contrast ratio for large text (`≥18pt` or `≥14pt bold`) and essential graphical UI components (input borders, active tab underlines).
2. **Focus Visibility**:
   - Interactive elements must display a distinct focus indicator ring upon keyboard navigation:
     `focus-visible:ring-2 focus-visible:ring-brand-orange-500 focus-visible:ring-offset-2`
3. **Screen Reader Semantic Attributes**:
   - Bilingual language tags on root containers (`html[dir="rtl"][lang="ar"]` vs `html[dir="ltr"][lang="en"]`).
   - Live regions (`aria-live="polite"`) for search result counters, OTP countdown timer, and chat arrival alerts.
