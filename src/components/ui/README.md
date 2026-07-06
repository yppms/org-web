# Shared UI foundation (`src/components/ui`)

The reusable, presentational building blocks for the portal. **Build new features
out of these** instead of hand-writing markup — that's how the app stays consistent.
They are token-only (no data fetching, no business logic); data comes from
[`useApi`](../../hooks/useApi.ts) and the API layer in [`src/lib/api.ts`](../../lib/api.ts).

## Components

| Component | Use for | Key props |
|-----------|---------|-----------|
| `Spinner` | Loading state | `variant="page" \| "section"`, `label` (e.g. `"Memuat..."`) |
| `ErrorAlert` | Surfacing an error message | `message` |
| `EmptyState` | "No data" placeholder | `message`, `icon` |
| `SectionHeader` | Section title + count badge | `title`, `count`, `countLabel`, `actions` |
| `TransactionCard` | List/transaction card shell | `header`, `footer`, children (body) |
| `StatCard` | Gradient summary/stat tile | `label`, `value`, `hint`, `tone` |
| `Modal` | Any dialog | `open`, `onClose`, `title`, `actions`, `dismissable` |
| `ConfirmDialog` | Continue → Confirm flows | `open`, `onClose`, `onConfirm`, `tone`, `loading` |

Import from the barrel: `import { Spinner, ErrorAlert } from "@/components/ui";`

## Design tokens — do not hardcode

All color comes from the `miftahussalam` daisyUI theme in
[`tailwind.config.ts`](../../../tailwind.config.ts). **Never use raw palette
utilities** (`text-green-600`, `border-blue-500`, `bg-red-100`) or hex values.

### Color = meaning (strict semantic palette)

There is exactly **one green** and **one blue** (`success`/`accent` are rethemed
to equal `primary`/`info`). Pick a token by what it *means*, not by how it looks:

| Meaning | Token |
|---------|-------|
| positive / paid / money / brand / highlight | `primary` (green) |
| unpaid / outstanding / destructive / negative | `error` (red) |
| pending / needs attention | `warning` (amber) |
| informational / overpaid | `info` (blue) |
| muted text / dividers | `base-content/60`, `neutral` |

There is **no purple/orange** — use `primary`/`warning`. On a colored background,
let daisyUI set the text color (`btn-primary` already implies `primary-content`);
don't add `text-white`.

### Typography roles

Use the default size scale (`text-xs` … `text-lg`) via these roles — no arbitrary
`text-[10px]`:

| Role | Classes |
|------|---------|
| heading (section titles) | `text-lg font-bold` — via `SectionHeader` |
| subheading | `text-base font-semibold` |
| body | `text-sm` |
| label / caption | `text-xs text-base-content/60` |

### Layout

The mobile frame width is the `max-w-app` token (425px) — use it, not
`max-w-[425px]`. The frame itself is applied once in
[`src/app/layout.tsx`](../../app/layout.tsx).
