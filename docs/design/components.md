# Egyptian Student Housing Platform — Component Library Specifications

**Document ID**: `DES-CMP-001`  
**Version**: `1.0.0` (Milestone 1 — Discovery & Architecture)  
**Status**: `Approved Standard`  
**Target Applications**: `apps/web` (Next.js App Router), React UI Component Library  
**Source Rules**: `app.txt` (Search & Booking limits, Verification badges, 1:1 chat, OTP flow)

---

## 1. Component Architecture & Design Principles

All components in the design system adhere to the following principles:

1. **Bi-Directional Native (RTL/LTR)**: Fully mirrored using CSS logical properties (`ms-*`, `pe-*`, `start-*`, `end-*`) without separate RTL stylesheets.
2. **Accessible by Default (WCAG 2.1 AA)**: Semantic HTML tags, clear ARIA roles, visible keyboard focus indicators (`ring-2 ring-brand-orange-500`), and minimum 44px touch targets.
3. **Multi-State Coverage**: Explicit definitions for Default, Hover, Active/Pressed, Focused, Disabled, Loading, and Error states.
4. **Strict Monorepo Placement**: Implemented in `apps/web/src/components/` structured into `ui/`, `layout/`, `navigation/`, `forms/`, `feedback/`, `data-display/`, and `maps/`.

---

## 2. Component Specifications

```
+-----------------------------------------------------------------------------------------+
|                                COMPONENT CATALOG INDEX                                  |
| 1. Property Card                           5. In-App Direct Chat UI                     |
| 2. Dual Search Controls (Grid vs Map)      6. Verification Badges (Owner/Property/Admin)|
| 3. Filter Drawer & Sticky Bar              7. 6-Digit OTP Verification Field            |
| 4. Booking Request Modal (3-Limit Safe)    8. Responsive Navigation Bar & Profile Menu  |
+-----------------------------------------------------------------------------------------+
```

---

### Component 1: Property Card (`PropertyCard`)

**Category**: `data-display` | **Directory**: `apps/web/src/components/data-display/PropertyCard.tsx`  
The foundational discovery element displaying accommodation listings in card and list view.

```
+-------------------------------------------------------------+
| [ < ]  [ 1 / 8 ]   [Image Carousel: Cloudinary]       [ > ] |
| [مالك موثوق] (Top-Start)                 [طالبات فقط] (Top-End) |
+-------------------------------------------------------------+
| 2,500 ج.م / شهرياً               [متاح 2 سرير من 4]         |
| شقة طلابية مفروشة - 3 غرف نوم                               |
| الدقي، الجيزة • شارع التحرير                                |
| 🎓 1.2 كم من جامعة القاهرة (الحرم الرئيسي)                    |
| [ عرض التفاصيل ]                                            |
+-------------------------------------------------------------+
```

#### Anatomy & Sub-Elements

1. **Image Carousel Container**:
   - Aspect ratio: `16:9` on mobile, `4:3` on desktop grids.
   - Cloudinary image with responsive `srcset`, `loading="lazy"`, and WebP format.
   - Previous / Next navigation chevrons (appear on hover/desktop; touch-swipeable on mobile).
   - Photo counter pill at bottom-center: e.g., `1 / 8`.
2. **Status Badges Overlay**:
   - `Top-Start (RTL: Top-Right)`: `VerificationBadge` (`مالك موثق` or `عقار تم فحصه`).
   - `Top-End (RTL: Top-Left)`: Gender Policy Tag (`طلاب بنين`, `طالبات بنات`, or `عائلات`).
3. **Pricing Block**:
   - Primary Price: Text `Heading 3` (`22px`), Bold, Color: `brand-navy-900` (`dark:text-slate-50`).
   - Unit & Duration: Text `Body Small` (`14px`), Color: `slate-500` (`ج.م / شهرياً` or `EGP / month`).
4. **Availability Pill**:
   - Color: Emerald `emerald-100` background + `emerald-700` text (`متاح 2 سرير`).
5. **Title & Location**:
   - Listing Title: `Heading 4` (`18px`), SemiBold, single-line truncation with tooltip.
   - Neighborhood & City: `Body Small` with `MapPin` icon (`الدقي، الجيزة`).
6. **Campus Proximity Metric**:
   - Highlighting distance strictly to the university's main campus: `🎓 1.2 كم من جامعة القاهرة`.
7. **Action CTA**:
   - Primary Button: `عرض التفاصيل` (`View Details`), Full width or trailing alignment.

#### States

- **Default**: `bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm`.
- **Hover**: `border-brand-orange-300 dark:border-brand-orange-700 shadow-md transform -translate-y-1 transition-all duration-200`.
- **Focus-Visible**: `ring-2 ring-brand-orange-500 ring-offset-2 outline-none`.

---

### Component 2: Dual Search Controls (`DualSearchToggle`)

**Category**: `navigation` | **Directory**: `apps/web/src/components/navigation/DualSearchToggle.tsx`  
Controls the synchronization between the interactive Google Maps view and the listing card grid.

```
+-------------------------------------------------------+
|  [ ⊞ عرض البطاقات (14) ]    |    [ 📍 الخريطة ]        |
+-------------------------------------------------------+
```

#### Anatomy & Specifications

- **Container**: Segmented rounded pill container (`rounded-full bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700`).
- **Segment 1 (Card View)**:
  - Icon: `LayoutGrid` (20px).
  - Label: `عرض البطاقات` (with active property count: `14 عقار`).
- **Segment 2 (Map View)**:
  - Icon: `MapPin` (20px).
  - Label: `عرض الخريطة`.
- **Active Indicator**: Animated sliding pill (`bg-white dark:bg-slate-900 shadow-sm text-brand-orange-600 dark:text-brand-orange-400 font-semibold`).
- **Mobile Responsive Floating Behavior**:
  - On mobile devices (`<768px`), this control renders as a floating action bar centered at the bottom of the viewport (`fixed bottom-6 start-1/2 -translate-x-1/2 z-30 shadow-lg`).

---

### Component 3: Filter Drawer & Filter Bar (`FilterBar` & `FilterDrawer`)

**Category**: `forms` | **Directory**: `apps/web/src/components/forms/FilterDrawer.tsx`  
Multi-parameter search filtering interface supporting all confirmed parameters in `app.txt §5.6`.

```
+------------------------------------------------------------------------------------------+
| [ المدينة: القاهرة v ] [ الحي: الدقي v ] [ الجامعة: جامعة القاهرة v ] [ الميزانية v ] [ فلاتر إضافية ⚙ ] |
+------------------------------------------------------------------------------------------+
```

#### Filter Attributes Covered

1. **City Dropdown (`CitySelect`)**: Single select (القاهرة, الجيزة, الإسكندرية, etc.).
2. **Area / Neighborhood Multi-Select (`AreaSelect`)**: Filter by specific districts (الدقي, العجوزة, بين السرايات).
3. **University Selector (`UniversitySelect`)**: Targets specific university main campus coordinates.
4. **Distance to Campus Slider (`DistanceSlider`)**:
   - Range: `0.5 كم` to `20 كم` (Step: `0.5 كم`).
   - Dynamic readout: `في نطاق 2.5 كم من جامعة القاهرة`.
5. **Budget Range Slider (`BudgetRangeSlider`)**:
   - Dual-thumb range slider (Min / Max in Egyptian Pounds).
   - Text inputs for explicit typing: `من: 1,000 ج.م` — `إلى: 4,500 ج.م`.
6. **Accommodation Type Chips (`AccommodationTypeChips`)**:
   - Single/multi toggle chips: `مبنى كامل` (Building), `شقة مستقلة` (Apartment), `غرفة خاصة` (Private Room), `سرير مشترك` (Shared Bed).
7. **Accommodation Duration (`DurationSelect`)**:
   - Radio buttons: `شهرياً` (Monthly), `فصلي / ترم` (Semester), `سنوياً` (Yearly), `أسبوعياً` (Weekly).
8. **Gender Policy Filter (`GenderPolicyFilter`)**:
   - `طلاب بنين فقط` (Male Only) | `طالبات بنات فقط` (Female Only) | `عائلات / مشترك` (Mixed/Family).

#### Drawer Actions

- **Header**: Title `تصفية نتائج البحث`, Close button (`X`), and `إعادة ضبط` (Reset All).
- **Footer**: Sticky action bar containing `تطبيق الفلاتر (عرض 18 عقار)` (Apply Filters).

---

### Component 4: Booking Request Modal (`BookingRequestModal`)

**Category**: `feedback` | **Directory**: `apps/web/src/components/feedback/BookingRequestModal.tsx`  
Enforces the 3-open-request limit, calculates pricing breakdowns, and handles mandatory contact disclosure consent.

```
+--------------------------------------------------------------------+
| طلب حجز سكن — شقة 4، شارع التحرير، الدقي                     [ X ] |
+--------------------------------------------------------------------+
| ℹ️ حالة طلباتك: لديك 1 من أصل 3 طلبات حجز مسموح بها حالياً          |
|                                                                    |
| اختر الجزء المطلوب حجزه:                                           |
| (•) سرير رقم 2 في غرفة مشتركة (بنات) — 1,500 ج.م/شهر               |
| ( ) سرير رقم 1 في غرفة مشتركة (بنات) — 1,500 ج.م/شهر               |
|                                                                    |
| تفاصيل التكلفة التقديرية:                                          |
| • الإيجار الشهري: 1,500 ج.م                                        |
| • مصاريف استهلاك مياه وكهرباء (إلزامية): 150 ج.م/شهر                |
| • خدمة تنظيف أسبوعية (اختيارية): [✓] 200 ج.م/شهر                   |
| ------------------------------------------------------------------ |
| الإجمالي التقديري: 1,850 ج.م / شهر                                 |
|                                                                    |
| ⚠️ إشعار الخصوصية ومشاركة البيانات (إلزامي):                       |
| بمجرد إرسال الطلب، سيتم مشاركة اسمك ورقم هاتفك والبريد الإلكتروني  |
| مع مالك العقار للتنسيق المباشر وترتيب المعاينة.                     |
| [✓] أوافق على مشاركة بيانات الاتصال مع مالك العقار                 |
|                                                                    |
| ملاحظات أو استفسارات إضافية للمالك:                                |
| [................................................................] |
|                                                                    |
| [ إلغاء ]                                       [ إرسال طلب الحجز ]|
+--------------------------------------------------------------------+
```

#### Critical Business Rules Enforced in UI

1. **Three-Request Quota Banner**:
   - `requestsCount < 2`: Blue Informative Banner (`لديك 1 من 3 طلبات مفتوحة`).
   - `requestsCount === 2`: Amber Warning Banner (`تنبيه: هذا هو طلبك الثالث والأخير المسموح به`).
   - `requestsCount >= 3`: Red Error Alert (`لا يمكنك إرسال طلب جديد. لقد استنفدت الحد الأقصى (3 طلبات مفتوحة). يجب إلغاء طلب سابق أولاً`). Primary submit button is disabled.
2. **Target Portion Selector**:
   - Selects specific available bed, room, or unit. Prevents ambiguity.
3. **Itemized Expense Summary**:
   - Separates base rent from mandatory expenses and optional add-ons.
4. **Mandatory Contact Disclosure Agreement (`app.txt §5.11`)**:
   - Consent checkbox required before submit button becomes enabled.

---

### Component 5: In-App Direct Chat UI (`DirectChatView`)

**Category**: `feedback` | **Directory**: `apps/web/src/components/feedback/DirectChatView.tsx`  
Permanent 1:1 text conversation tied to the booking request (`app.txt §5.10`).

```
+--------------------------------------------------------------------+
| [←] أ. محمد محمود [مالك موثوق]               [ 📞 اتصال ] [ 💬 واتساب ]|
| بخصوص: غرفة خاصة - شقة 12 بالدقي (طلب حجز #BR-4091)                |
+--------------------------------------------------------------------+
|                   [ تم إنشاء المحادثة في 20 نوفمبر 2026 ]          |
|                                                                    |
| (أ. محمد - 10:15 ص)                                               |
| أهلاً بك يا أحمد. موعد المعاينة متاح غداً الساعة 4 عصراً في العقار.|
|                                                                    |
|                                         (أنت - 10:18 ص) [✓✓]       |
| ممتاز يا فندم، سأكون متواجد في الموعد إن شاء الله.                 |
|                                                                    |
| ℹ️ تنبيه النظام: تبقى هذه المحادثة مفتوحة دائماً للتواصل المباشر   |
+--------------------------------------------------------------------+
| [ اكتب رسالتك هنا...                                     ] [ إرسال ]|
+--------------------------------------------------------------------+
```

#### Anatomy & Specifications

1. **Header Contact Card**:
   - Participant name, verified status badge, role tag (`مالك العقار` / `طالب`).
   - Direct communication triggers: Phone call button (`tel:+20...`) and WhatsApp direct link (`https://wa.me/20...`).
   - Property context link: Links back to listing and booking request details.
2. **Permanent Lifecycle Notice**:
   - A subtle header note clarifies: _المحادثة تظل مفتوحة للتواصل حتى في حالة إلغاء أو رفض الطلب_.
3. **Message Bubbles**:
   - **Current User (Self)**: Aligned to trailing edge (`end`), background: `brand-navy-900` (`dark:bg-brand-orange-600`), text: `white`, rounded corners with flat anchor corner (`rounded-2xl rounded-ee-xs`).
   - **Counterparty (Other)**: Aligned to leading edge (`start`), background: `slate-100` (`dark:bg-slate-800`), text: `slate-900` (`dark:text-slate-100`), rounded corners with flat anchor corner (`rounded-2xl rounded-ss-xs`).
   - **Read Indicators**: Single check (`✓` sent), double check (`✓✓` delivered/read).
4. **Message Composer**:
   - Text-only input field (strictly text per `app.txt §5.10`; no file upload allowed in MVP chat).
   - Submit action button with `Send` icon (mirrored in RTL).

---

### Component 6: Verification Badge (`VerificationBadge`)

**Category**: `ui` | **Directory**: `apps/web/src/components/ui/VerificationBadge.tsx`  
Trust indicator rendered on property cards, user profiles, and chat headers.

#### Variants & Specification Matrix

| Variant Prop        | Arabic Label | English Label     | Icon (Lucide)         | Visual Style (Classes)                                                                                                       |
| ------------------- | ------------ | ----------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `owner-verified`    | مالك موثوق   | Verified Owner    | `ShieldCheck` (16px)  | `bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800` |
| `property-verified` | عقار تم فحصه | Verified Property | `CheckCircle2` (16px) | `bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800`                   |
| `admin`             | إدارة المنصة | Superadmin        | `ShieldAlert` (16px)  | `bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800`       |
| `pending`           | قيد المراجعة | Pending Review    | `Clock` (16px)        | `bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800`             |
| `unverified`        | غير موثق     | Unverified        | `AlertCircle` (16px)  | `bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700`            |

---

### Component 7: 6-Digit OTP Verification Field (`OtpInputField`)

**Category**: `forms` | **Directory**: `apps/web/src/components/forms/OtpInputField.tsx`  
Secure 6-digit phone verification input with automatic progression, paste handling, and countdown.

```
+-------------------------------------------------------+
|              أدخل رمز التحقق المكون من 6 أرقام        |
|               تم إرسال الرمز إلى: +20 10 1234 5678    |
|                                                       |
|        [ 4 ]  [ 8 ]  [ 2 ]  [ 0 ]  [ 9 ]  [ 1 ]       |
|                                                       |
|           إعادة إرسال الرمز خلال (00:42)               |
|            [ إعادة إرسال الرمز الآن ] (معطل)           |
+-------------------------------------------------------+
```

#### Specifications & Behavior

1. **Six Dedicated Digit Inputs**:
   - Dimension: `48px x 56px` each.
   - Text size: `24px`, bold, centered, `font-mono`.
   - `inputMode="numeric"`, `pattern="[0-9]*"`, `autoComplete="one-time-code"`.
2. **Keyboard Traversal Logic**:
   - Entering a digit automatically shifts focus to the next input (`index + 1`).
   - Pressing `Backspace` on an empty input shifts focus backwards (`index - 1`).
   - Pasting a 6-digit string distributes characters across all 6 inputs and triggers auto-submit.
3. **Resend Timer (`CountdownTimer`)**:
   - Starts at `60` seconds.
   - While `seconds > 0`: Resend button is disabled, showing countdown: `إعادة إرسال الرمز خلال (00:XX)`.
   - When `seconds === 0`: Resend button becomes enabled with primary orange text.
4. **Error Handling**:
   - Red border (`border-rose-500`), subtle shake animation, and error message text below the inputs.

---

### Component 8: Responsive Navbar & Profile Menu (`Navbar`)

**Category**: `navigation` | **Directory**: `apps/web/src/components/navigation/Navbar.tsx`  
Global header providing brand presence, navigation links, locale toggle, and authenticated user controls.

```
+----------------------------------------------------------------------------------------+
| [الشعار: سكن]  [الرئيسية]  [ابحث عن سكن]  [الجامعات]  [أضف عقارك]     [🔔 2] [👤 أحمد v] [EN] |
+----------------------------------------------------------------------------------------+
```

#### Anatomy & Specifications

1. **Brand Mark**:
   - Orange icon + Navy typography (`سكن الطلاب` / `Student Housing`).
2. **Primary Navigation Links**:
   - `الرئيسية` (`Home`)
   - `ابحث عن سكن` (`Browse Housing`)
   - `الجامعات المصرية` (`Universities`)
   - `أضف عقارك` (`List Property` — highlighted for property owners)
3. **Language Switcher (`LocaleSwitcher`)**:
   - Compact toggle button: `English` (in Arabic mode) / `عربي` (in English mode).
   - Preserves current path and search query params while toggling `/[locale]/`.
4. **Notification Center Bell**:
   - Bell icon with red unread counter badge (`bg-rose-500 text-white text-xs rounded-full`).
5. **Authenticated Profile Dropdown**:
   - Displays avatar circle, full name, and role badge (`طالب` / `مالك عقار` / `مسؤول`).
   - Links:
     - `لوحة التحكم` (Dashboard)
     - `طلبات الحجز` (Booking Requests — with badge)
     - `المحادثات` (Messages)
     - `إعدادات الحساب` (Settings)
     - `تسجيل الخروج` (Logout — red hover)
6. **Mobile Responsive Drawer**:
   - Hamburger icon triggers slide-in navigation drawer containing all links and locale switcher on viewports `<1024px`.
