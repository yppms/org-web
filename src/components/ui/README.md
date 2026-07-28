# Shared UI foundation (`src/components/ui`)

The reusable building blocks for the portal. **Build new features out of these**
instead of hand-writing markup. Two layers live here:

1. **shadcn/ui primitives** (lowercase files): `button`, `card`, `badge`,
   `input`, `label`, `chip`, `switch`, `separator`, `tabs`, `table`, `dialog`,
   `alert-dialog`. CVA + Radix based; styled with the theme tokens below.
2. **App composites** (PascalCase files): `Spinner`, `ErrorAlert`, `EmptyState`,
   `SectionHeader`, `StatCard`, `Modal`. Token-only (no data fetching); data
   comes from [`useApi`](../../hooks/useApi.ts) and
   [`src/lib/api.ts`](../../lib/api.ts).

Every section heading uses `SectionHeader` (title + optional subtitle / count /
actions) and every card title uses `CardHeader` + `CardTitle` with
`border-b border-border` — don't hand-roll an `<h2>` or `<h3>`.

Import from the barrel: `import { Button, Card, Badge, Spinner } from "@/components/ui";`

## Never truncate or shrink text — let it stack

**Do not use `truncate`, `text-ellipsis`, `line-clamp-*`, or `overflow-hidden` on
text**, and never shrink a font size to make content fit. On a 425px column,
content must **wrap onto more lines** and the row must grow taller instead.

The pattern for a "label left / amount right" row is a `min-w-0` text column
beside a `shrink-0` value, with `items-start` so the value stays top-aligned as
the text wraps:

```tsx
<div className="flex items-start justify-between gap-3">
  <div className="min-w-0">…wrapping text…</div>
  <span className="shrink-0 font-mono">{formatCurrency(amount)}</span>
</div>
```

`min-w-0` is what lets the text column wrap (without it a flex child refuses to
shrink below its content width and overflows). To pair two inline bits that
should split onto separate lines when tight, use `flex-wrap` with `gap-x`/`gap-y`
— see [`ActivityRow`](../../app/kindy/student/components/ActivityRow.tsx).

`whitespace-nowrap` stays acceptable in two places only: short control labels
(`Button`, `Badge`, `Chip`, `Tabs`) and currency/account numbers that must never
break mid-value.

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

### Long-form prose — the `prose` class

`prose` (defined in [`globals.css`](../../app/globals.css)) is justified text with
automatic hyphenation. On a 425px column, a long block reads noticeably tidier
with flush edges — hyphenation is what keeps justify from opening rivers of
whitespace at this width, so the two always ship together.

```tsx
<p className="prose text-xs leading-relaxed text-muted-foreground">…</p>
```

**Use it only on blocks that wrap to three or more lines** — teacher notes
([`ReportEntryBody`](../../app/kindy/student/components/harian/ReportEntryBody.tsx)),
disclaimers, multi-paragraph explanations.

**Never** on labels, row values, buttons, table cells, or the one-to-two line
helper sentences in modals and cards. Justify leaves a paragraph's *last* line
ragged, so a short block gains one stretched line and nothing else — it looks
worse than plain ragged-right. When in doubt, leave it off.

Hyphenation relies on `<html lang="id">` ([`layout.tsx`](../../app/layout.tsx)) —
the browser needs the language to know where Indonesian words may break. Don't
set `lang` per element.

### Shape

Cards `rounded-xl` (12px) + `border border-border` + `shadow-card` (light only);
buttons/inputs `rounded-lg`; badges/chips `rounded-md`; filter chips are the
fully-rounded `<Chip>`. Dialogs are centered, `max-w-[400px]`, `p-6`.

### Layout

Mobile frame width is `max-w-app` (425px), applied once in
[`layout.tsx`](../../app/layout.tsx).

## Cards — always the `<Card>` component

**Never hand-roll card chrome.** `<div className="bg-card border border-border
rounded-xl shadow-card">` is `<Card>`; writing it by hand means the chrome drifts
(and it has — that markup existed in nine places with two different class
orderings). Pass only *padding* overrides via `className`.

Every card with a title uses the same anatomy — no bare `<h3>` inside
`CardContent`:

```tsx
<Card>
  <CardHeader className="border-b border-border">   {/* + flex-row items-center
      justify-between when the title has a trailing Button/Badge */}
    <CardTitle>Skema Biaya</CardTitle>
  </CardHeader>
  <CardContent className="pt-3">…</CardContent>
</Card>
```

Padding: full-width cards keep `CardHeader`'s default `p-5` with `CardContent
className="pt-3"`. Compact tiles in a 2-column grid use `p-4` on **both** header
and content — a `p-5` header over a `p-4` body reads as a misalignment.

## Sticky / fixed bars

Top headers and the bottom nav are translucent with a blur and **no border**:
`bg-card/75 backdrop-blur-md`. Content passes softly underneath. Don't add
`border-b`/`border-t` — the bar already sits on a different surface than the
page, so a border makes a doubled separator (and in dark mode `--border` is
*lighter* than both, which reads as a glowing seam). Keep `blur-md`; `blur-xl`
samples wide enough to pull neighbouring text into the bar as ghosting.

## Formatting — always via [`lib/utils`](../../lib/utils.ts)

Never call `toLocaleString` / `toLocaleDateString` / `Intl.*` in a component, and
never post-process a formatter's output (`formatCurrency(x).replace("Rp", "")`).
The audience is Indonesian; an `en-GB` locale slipping in is a bug.

| Need | Use |
|------|-----|
| money for display | `formatCurrency(1500000)` → `Rp1.500.000` |
| date | `formatDate(iso)` → `26-Jul-26` |
| date + time | `formatDateTime(iso)` → `26-Jul-26 14:05` |
| currency **text input** (no prefix) | `formatAmountInput(raw)` → `1.500.000` |
| currency text input (with prefix) | `formatRupiah(raw)` → `Rp1.500.000` |

Every rendered amount, account number, phone and ID also gets `font-mono`.

## Dialogs

All modals are React-state-controlled shadcn `Dialog` / `AlertDialog` (drive with
`open` / `onOpenChange`) — no native `<dialog>`/`showModal()`/`getElementById`.
`Modal` is a thin wrapper over `Dialog` with the legacy
`open` / `onClose` / `title` / `actions` API.
