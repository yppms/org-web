# Shared UI foundation (`src/components/ui`)

The reusable building blocks for the portal. **Build new features out of these**
instead of hand-writing markup. Two layers live here:

1. **shadcn/ui primitives** (lowercase files): `button`, `card`, `badge`,
   `input`, `label`, `chip`, `switch`, `separator`, `tabs`, `table`, `dialog`,
   `alert-dialog`. CVA + Radix based; styled with the theme tokens below.
2. **App composites** (PascalCase files): `Spinner`, `ErrorAlert`, `EmptyState`,
   `SectionHeader`, `TransactionCard`, `StatCard`, `AmountBadge`, `Modal`,
   `ConfirmDialog`. Token-only (no data fetching); data comes from
   [`useApi`](../../hooks/useApi.ts) and [`src/lib/api.ts`](../../lib/api.ts).

Import from the barrel: `import { Button, Card, Badge, Spinner } from "@/components/ui";`

## Design tokens — do not hardcode

All color comes from CSS variables defined on `:root` / `.dark` in
[`globals.css`](../../app/globals.css) and wired into Tailwind in
[`tailwind.config.ts`](../../../tailwind.config.ts). The theme is **zinc neutrals
+ a green brand accent**, with **light + dark** mode (toggle = the `dark` class on
`<html>`, persisted to `localStorage['yppms-theme']` — see
[`ThemeToggle`](../ThemeToggle.tsx)). **Never use raw palette utilities**
(`text-green-600`) or daisyUI classes (`btn`, `card`, `bg-base-100`,
`text-base-content`, `modal`, …) — daisyUI has been removed.

### Semantic Tailwind tokens

| Meaning | Token utilities |
|---------|-----------------|
| page / surface | `bg-background`, `bg-card`, `text-foreground` |
| secondary text / dividers | `text-muted-foreground`, `bg-muted`, `border-border` |
| positive / paid / money / brand | `text-primary`, `bg-primary`, `bg-primary-soft` |
| unpaid / destructive | `text-destructive`, `bg-destructive-soft` |
| pending / needs attention | `text-warning`, `bg-warning-soft` |
| informational / overpaid | `text-info`, `bg-info-soft` |

**Color = meaning.** Status is always a **soft badge** (`<Badge variant="…">`):
soft-tint background + strong-color text. Variants: `default` (primary-soft),
`secondary` (muted), `destructive`, `warning`, `info`, `outline`.

### Typography

- **Geist** for UI text, **Geist Mono** (`font-mono`) for every money amount,
  account number, phone number, and ID.
- Roles: page/section title `text-lg font-semibold` · card title
  `text-base font-semibold` · row title `text-sm font-medium` · body `text-[13px]`
  · caption/label `text-xs text-muted-foreground` · hero amount
  `text-3xl font-bold font-mono tracking-[-0.02em]` · uppercase micro-labels
  `text-xs font-semibold uppercase tracking-[0.04em] text-muted-foreground`.

### Shape

Cards `rounded-xl` (12px) + `border border-border` + `shadow-card` (light only);
buttons/inputs `rounded-lg`; badges/chips `rounded-md`; filter chips are the
fully-rounded `<Chip>`. Dialogs are centered, `max-w-[400px]`, `p-6`.

### Layout

Mobile frame width is `max-w-app` (425px), applied once in
[`layout.tsx`](../../app/layout.tsx).

## Dialogs

All modals are React-state-controlled shadcn `Dialog` / `AlertDialog` (drive with
`open` / `onOpenChange`) — no native `<dialog>`/`showModal()`/`getElementById`.
`Modal` and `ConfirmDialog` are thin wrappers over `Dialog` with the legacy
`open` / `onClose` / `title` / `actions` API.
