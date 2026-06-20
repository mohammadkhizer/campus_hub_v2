# UI/UX Design Brief
> **Version:** 1.0 | **Product:** Campus Hub LMS
> **Classification:** INTERNAL · DESIGN · ENGINEERING
> **Stack:** Tailwind CSS · Radix UI · Framer Motion · Next.js 15

---

## 🎨 Design Philosophy

Campus Hub follows a **premium dark-first** design language. Every interface decision prioritises:
1. **Clarity** — dense information, zero cognitive noise
2. **Trust** — enterprise-grade visual polish signals reliability
3. **Accessibility** — WCAG 2.1 AA compliant throughout
4. **Delight** — Framer Motion micro-animations on every interaction

---

## 🎨 Color System

### Base Palette (CSS Variables / Tailwind Tokens)

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-bg` | `#0f111a` | Page background |
| `--color-surface` | `#1e2130` | Cards, panels, sidebars |
| `--color-border` | `#334155` | Dividers, card borders |
| `--color-text-primary` | `#e2e8f0` | Headings, body copy |
| `--color-text-muted` | `#94a3b8` | Labels, captions, placeholders |
| `--color-accent` | `#3b82f6` | Primary CTA, links, active states |
| `--color-accent-hover` | `#2563eb` | Hover state for accent |
| `--color-success` | `#22c55e` | Success states, completed badges |
| `--color-warning` | `#eab308` | Warnings, pending states |
| `--color-danger` | `#ef4444` | Errors, destructive actions |
| `--color-info` | `#06b6d4` | Info banners, tooltips |

### Role Accent Colors

| Role | Color | Hex |
|------|-------|-----|
| Student | Blue | `#3b82f6` |
| Teacher | Purple | `#8b5cf6` |
| Administrator | Amber | `#f59e0b` |
| Super Admin | Red/Orange | `#ef4444` |

---

## 📝 Typography

| Scale | Size | Weight | Usage |
|-------|------|--------|-------|
| Display | 3rem / 48px | 800 | Hero headings |
| H1 | 2.25rem / 36px | 700 | Page titles |
| H2 | 1.5rem / 24px | 600 | Section headings |
| H3 | 1.125rem / 18px | 600 | Card titles |
| Body | 1rem / 16px | 400 | Default content |
| Small | 0.875rem / 14px | 400 | Labels, captions |
| Micro | 0.75rem / 12px | 500 | Badges, tags, timestamps |

**Font Family:** `Inter` (Google Fonts) with system fallback `system-ui, -apple-system, sans-serif`

**Font Loading:** `next/font/google` with `display: swap` for zero CLS

---

## 📐 Spacing & Layout

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Micro gaps |
| `space-2` | 8px | Component padding |
| `space-3` | 12px | Inner card padding |
| `space-4` | 16px | Standard padding |
| `space-6` | 24px | Section gaps |
| `space-8` | 32px | Large section gaps |
| `space-12` | 48px | Page-level padding |

**Container max-width:** `1280px` centered, `px-4 md:px-8`

**Grid system:**
- Dashboard widgets: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- Form layouts: `grid-cols-1 md:grid-cols-2`
- Content + sidebar: `grid-cols-1 lg:grid-cols-[1fr_300px]`

---

## 🧩 Component Library

All base components from **Radix UI** (headless), styled with Tailwind, located in `src/components/ui/`.

### Core Components

| Component | Base | Notes |
|-----------|------|-------|
| `Button` | Radix Slot | Variants: primary, secondary, ghost, destructive, outline |
| `Input` | Native + Radix | Zod error state, floating label optional |
| `Select` | Radix Select | Custom dark dropdown styling |
| `Dialog / Modal` | Radix Dialog | Focus trap built-in, backdrop blur |
| `Dropdown` | Radix DropdownMenu | Used in nav, table row actions |
| `Tabs` | Radix Tabs | Dashboard role switcher |
| `Toast` | Radix Toast | Top-right, 4 variants: success/error/info/warning |
| `Badge` | Custom | Rounded pill, role/status colors |
| `Skeleton` | Custom | Shimmer animation on all async content |
| `Card` | Custom | `bg-surface border-border rounded-xl p-6` |
| `Avatar` | Radix Avatar | Initials fallback, Cloudinary image |
| `Table` | Custom | Sticky header, hover rows, pagination footer |
| `Progress` | Radix Progress | Quiz completion, course progress |
| `Tooltip` | Radix Tooltip | Keyboard accessible, 200ms delay |

### Button Variants

```tsx
// Primary (default)
className="bg-accent hover:bg-accent-hover text-white font-medium px-4 py-2 rounded-lg transition-colors"

// Ghost
className="hover:bg-white/5 text-text-primary px-4 py-2 rounded-lg transition-colors"

// Destructive
className="bg-danger/10 hover:bg-danger/20 text-danger border border-danger/30 px-4 py-2 rounded-lg"
```

---

## ✨ Animation System (Framer Motion)

### Standard Transition Presets

```tsx
// Page entry
{ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.2 } }

// Card hover
{ whileHover: { scale: 1.01, y: -2 }, transition: { type: 'spring', stiffness: 400, damping: 25 } }

// List stagger (dashboard widgets)
{ variants: { container: { transition: { staggerChildren: 0.06 } }, item: { opacity: 0 → 1, y: 16 → 0 } } }

// Modal overlay
{ initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.15 } }

// Button press
{ whileTap: { scale: 0.97 } }
```

### Loading States
- **Skeleton loaders** on every async data section (never show blank/empty during fetch)
- Shimmer: `animate-pulse bg-gradient-to-r from-surface via-white/5 to-surface bg-[size:200%]`
- Minimum skeleton display time: 300ms (prevents flicker on fast connections)

---

## 📊 Dashboard Widget Patterns

### Stat Card (KPI)
```
┌─────────────────────────────┐
│ 📘 LABEL          [trend ↑] │
│                             │
│   1,240                     │
│   Enrolled Students         │
│                             │
│ ████████░░ 78% of target    │
└─────────────────────────────┘
```
- Background: `bg-surface`
- Icon: Role-tinted, 32px
- Value: `text-3xl font-bold`
- Trend badge: green/red with arrow icon

### Data Table Pattern
- Sticky header row
- Alternating hover: `hover:bg-white/[0.03]`
- Action column: icon buttons (Edit, Delete, View)
- Pagination: `← Previous [1] [2] [3] Next →`
- Empty state: centered icon + message + CTA button

### Chart Containers (Recharts)
- Background: `bg-surface` card
- Grid lines: `stroke="#334155"` (border color)
- Tooltip: dark custom tooltip, rounded, shadow
- Colors: use role accent palette + `#3b82f6`, `#8b5cf6`, `#22c55e`, `#f59e0b`

---

## ♿ Accessibility Standards (WCAG 2.1 AA)

| Requirement | Implementation |
|-------------|----------------|
| Color contrast ≥ 4.5:1 | Verified for all text/background combos |
| Keyboard navigation | All interactive elements reachable via Tab |
| Focus visible | Custom focus ring: `focus-visible:ring-2 ring-accent ring-offset-2` |
| ARIA labels | All icon-only buttons have `aria-label` |
| Screen reader | Radix UI provides semantic ARIA roles |
| Skip-to-content | `<a href="#main" class="sr-only focus:not-sr-only">` |
| Form errors | ARIA live region: `aria-live="polite"` on error containers |
| Modal focus trap | Radix Dialog handles automatically |

---

## 📱 Responsive Breakpoints

| Breakpoint | Width | Layout Change |
|-----------|-------|---------------|
| `sm` | 640px | Stack mobile nav |
| `md` | 768px | 2-col grids |
| `lg` | 1024px | Sidebar visible, 3-col grids |
| `xl` | 1280px | 4-col dashboard grids |
| `2xl` | 1536px | Max container width capped |

**Mobile-first approach:** All components designed mobile → desktop.

**Critical mobile fixes:**
- `100dvh` instead of `100vh` (iOS Safari viewport fix)
- Touch targets minimum `44×44px`
- No hover-only interactions — all have tap equivalents

---

## 🖼️ Iconography

- **Library:** `lucide-react` (consistent stroke weight, tree-shakeable)
- **Size standards:** 16px (inline), 20px (buttons), 24px (nav), 32px (hero/stat cards)
- **Stroke width:** 1.5px default
- **Color:** inherit from parent text color unless semantically meaningful

---

## 📋 Form Design Patterns

### Input States
```
Default:  border-border bg-surface/50
Focus:    border-accent ring-1 ring-accent
Error:    border-danger ring-1 ring-danger/50
Success:  border-success
Disabled: opacity-50 cursor-not-allowed
```

### Form Layout Rules
1. Labels always above inputs (never floating on mobile)
2. Error messages below input, `text-danger text-sm`
3. Required fields marked with `*` and explained at form top
4. Submit button full-width on mobile, right-aligned on desktop
5. Loading state: button shows spinner + "Saving…" text, disabled

---

## 🚦 Status & Feedback Patterns

| State | Visual | Toast |
|-------|--------|-------|
| Success | Green badge / checkmark | ✅ "Saved successfully" |
| Error | Red border + message | ❌ "Something went wrong" |
| Loading | Skeleton / spinner | — |
| Empty | Centered illustration + CTA | — |
| Offline | Banner: "Connection lost" | — |

### Empty State Structure
```
[Icon — muted, 48px]
[Heading — "No quizzes yet"]
[Body — "Create your first quiz to get started."]
[CTA Button — "Create Quiz"]
```

---

## 🎓 Role-Specific UI Notes

| Role | Dashboard Character | Primary Color |
|------|--------------------|----|
| Student | Progress-forward · gamified milestones | Blue `#3b82f6` |
| Teacher | Tool-dense · creation-focused | Purple `#8b5cf6` |
| Administrator | Management grids · bulk operations | Amber `#f59e0b` |
| Super Admin | Data-rich · compliance-focused · audit trail | Red `#ef4444` |

Each role dashboard uses the same structural shell (`DashboardLayout`) but with role-tinted accent color applied to nav active states, stat card icons, and button primaries.

---

*UI/UX Design Brief v1.0 · Campus Hub · May 2026*
