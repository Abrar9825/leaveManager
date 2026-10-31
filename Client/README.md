# Leave Manager — React + Tailwind CSS (Kinetic Obsidian & Violet)

A pixel-perfect, fully responsive React + Tailwind CSS implementation of the **Leave Manager** interface suite, matching all 4 mockup designs and following the exact design specifications from `kinetic_obsidian_violet/DESIGN.md`.

---

## 🚀 Quick Start

```bash
# Install dependencies (already installed)
npm install

# Start Vite development server
npm run dev

# Create optimized production build
npm run build

# Preview production build locally
npm run preview
```

---

## 🎨 Design System: Kinetic Obsidian & Violet

This frontend follows the **Linear / Apple / Raycast** high-precision modernist aesthetic:

- **Atmospheric Obsidian Surface (`#171A35`):** Midnight dark hero containers featuring radial violet glows (`rgba(116, 100, 245, 0.28)`) for monumental metric displays.
- **Porcelain Daylight Cards (`#FFFFFF` on `#FBF8FF`):** Tactile cards with `22px` border radius (`rounded-[22px]`), ultra-fine `1px` borders (`#ECECF3`), and soft violet-tinted ground shadows.
- **Electric Violet Accent (`#5542D5` / `#7464F5`):** Primary action buttons with tactile shadows (`box-shadow: 0 4px 14px rgba(116, 100, 245, 0.38)`), interactive calendar states, and focus rings.
- **Semantic Feedback Colors:**
  - Approved / Healthy Balance: `#27C383` (Emerald)
  - Pending / Low Reserve: `#F5A623` (Warm Amber)
  - Overlap / Deficit: `#BA1A1A` / `#FF5A76` (Electric Rose)
- **Typography:** Google Font **Plus Jakarta Sans** with negative tracking on display figures (`-0.04em`), tabular numbers, and optical baseline alignment.
- **Icons:** Google **Material Symbols Outlined**.

---

## 📱 The 4 Screens Unified in React

All 4 mockups and screens have been implemented with 100% fidelity:

### 1. Overview / Balance & Activity (`leave_manager_balance_activity`)
- **Obsidian Hero Card:** Monumental display stat (`18` Days available) with pulse badge (`• YOUR AVAILABLE BALANCE`) and subtle annual cycle indicator (`Your leave balance for 2026`).
- **Interactive Year Navigator:** `< 2026 >` pill button with smooth animated scale transitions and balance updates across years (`2024`, `2025`, `2026`, `2027`).
- **Leave Activity Porcelain Card:**
  - Activity feed with pulsing kinetic violet dots.
  - Filter dropdown (`All time`, `This Month`, `Last 30 Days`, `Approved`).
  - Items: 24 October (Personal work - 1 Day), 18 October (Doctor appointment - Half Day), 12–13 October (Family function - 2 Days), 4 September (Annual wellness check - 1 Day).
  - One-click **Download Audit Report** (exports a live CSV file).

### 2. Leave Calendar (`leave_calendar_mobile_leave_manager`)
- **Header & Pill Bar:** Screen title with pulsing `• Synced` indicator, month navigator (`< October 2026 [Current] >`), and `Today` shortcut.
- **7-Column Calendar Grid (Mon–Sun):**
  - Connected multi-day pill ranges (12–13 October for Family function, 28–29 October upcoming).
  - Today circle highlight (15 October).
  - Half Day PM slot indicator (18 October with tertiary dot).
  - Selected Full Day leave (24 October with violet glow card).
  - Minimal legend (`• Full Day`, `• Half Day`, `• Multi-Day`, `• Today`).
- **Dynamic Date Detail Card:** Clicking any calendar day shows either the scheduled leave details or a quick `+ Request Leave` trigger for open dates.

### 3. Leave History & Monthly Breakdown (`leave_history_mobile_leave_manager`)
- **Hero Yearly Leave Summary:** 3-column metric cards (`24 Total Credits`, `8 Leaves Used`, `16 Balance`).
- **Year Selector:** Pill navigator with smooth year transitions.
- **Monthly Breakdown Porcelain Card:**
  - Accrual rate tag (`✨ +2 / mo`).
  - Month-by-month ledger for October (Current), September, August, July, June, May, April, March, February, January.
  - Dynamic deficit tags and soft red card highlights for deficit months (April & May).
  - Opening, Credit (`+2.0`), and Used (`-X.0`) columns.
  - Policy footnote: Monthly credit of 2 days on 1st of month.
  - One-click **Export Statement** (downloads official leave statement CSV).

### 4. Add Leave Request Form (`add_leave_leave_manager`)
- **Breadcrumb Navigation:** `← Leaves / New Entry` with back-navigation.
- **Duration Segmented Switch:** `Single Day` vs `Multiple Days`.
- **Date Range Engine:**
  - Single Day: Date picker with day-of-week context (`Wednesday, October 28, 2026 • Standard working day`).
  - Multiple Days: Start & End date pickers with automatic weekend exclusion (working days only).
- **Leave Type Proportion:**
  - `Full Day` (1.0 Day, 8h).
  - `Half Day` (0.5 Day) with `Morning (9am - 1pm)` vs `Afternoon (2pm - 6pm)` slot selector.
- **Reason & Quick Tags:** Textarea with 5 quick-tap pills (`+ Personal work`, `+ Doctor appointment`, etc.).
- **Dynamic Balance Preview Banner:** Real-time calculation showing Requested Days, Balance After, and status pills (`● Healthy balance`, `● Low reserve`, `● Balance exceeded`).
- **Actions & Toast Feedback:** Submit button with loading spinner, validation, balance deduction, and interactive floating Toast.

---

## 💻 Responsive Architecture

- **Mobile View (< 768px):** Matches mobile screenshots with touch-friendly targets, bottom navigation bar, and compact card headers.
- **Tablet / Desktop View (>= 768px):** Expands into standard 1440px centered container, top sticky desktop navigation with active pills, and fluid layouts.
- **Interactive Mode Switcher:** Includes a top toolbar toggle to switch between **Fluid Desktop** and **Mobile Mockup Device Frame** for instant visual comparison.

