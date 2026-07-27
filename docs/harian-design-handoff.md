# Laporan Harian — design handoff

A daily report for parents in the Kindy **student portal**. This document is the data
brief: what exists in the database, what one day looks like, and which states the design
has to survive. Sample payloads: [harian-sample-data.json](harian-sample-data.json).

**Scope: the teacher's note and its media, nothing else.** Attendance and meal data exist
and are populated, and report entries carry an unused development-tag field — all out of
this phase. See [Deferred](#deferred-not-this-phase) at the end.

## Status: the data exists, the API does not

| Layer | State |
| --- | --- |
| Database | **Fully populated.** 318 reports across 41 students / 5 active classes, 5 school days. |
| Teacher app writes it | Yes — `kindy-teacher` (separate app) is the author of every record. |
| Backend parent endpoint | **Does not exist.** `/kindy/student/*` has no report route. |
| `org-web` frontend | **Nothing.** No types, no API methods, no page. |

Greenfield on the portal side — but *not* a greenfield data model. The shapes below are
fixed by what the teacher app already writes and cannot be redesigned.

## Two kinds of report

### Class report — `type = 'CLASS_WIDE'`

The teacher writes one report for the whole class; the backend **fans it out to one row
per enrolled child**, all sharing a `batchId`. Every child in the class sees identical
text and identical media. This is the "what we did today" narrative — long and warm,
often opening with *Assalamu'alaikum Ayah Bunda* and closing with a thank-you.

### Individual report — `type = 'INDIVIDUAL'`

The child's personal note. Candid and specific — good days and hard days both:
*"masih menangis ketika ditinggal, namun hanya beberapa menit"*, *"ringan tangan & kaki
dengan kasar ketika bermain bersama"*. **The design must not assume every note is a
celebration.**

### How they co-occur — the class report is the spine

| Combination | Student-days | |
| --- | --- | --- |
| Class + individual | 119 | 60% |
| Class only | 80 | 40% |
| **Individual only** | **0** | **never happens** |

An individual report never exists without a class report on the same day. So the class
report anchors the day, and the personal note is an enrichment on top of it — not a peer.
A layout that treats them as two equal siblings will look wrong 40% of the time.

## The entry shape

`KindyReport.entries` is a **JSON array**. 311 of 318 reports have one entry; 7 have two.
Treat it as a list — and note that in a two-entry report the media is often on the
*second* entry, not the first.

```jsonc
{
  "noteParent": "…",   // the ONLY text the portal receives
  "photos":     [ { "path": "reports/….jpg", "url": "https://…?sig=…" } ]
}
```

A note and its media. That is the whole unit.

> ### The portal only ever sees `noteParent`
>
> The DB row also has a raw `note` column — the teacher's unfiltered internal
> observation. **It must never cross the wire to the parent portal.** `noteParent` is the
> teacher-approved rewrite: it addresses the child by honorific and nickname (*"Mas
> Bima"*, *"Mbak Naura"*) and often adds a gentle interpretation.
>
> The backend resolves any fallback server-side and emits this one field, so the design
> has a single text source and no conditional. In practice there is nothing to fall back
> from: **all 325 stored entries have a non-null `noteParent`**, and the legacy
> `notePersonalized` field appears on zero rows.

### Length is the design problem

Real notes run **500–1,500 characters** with numbered activity lists, `*asterisk
emphasis*` (WhatsApp-style, not markdown), emoji, blank lines, and occasional full
English. They must not be truncated — see the composition rules in
[CLAUDE.md](../CLAUDE.md). If a collapse/expand is wanted, that is a deliberate
interaction, not a `line-clamp`.

## Media: ~13% of it is video

Across all report entries: **846 `.jpg`, 71 `.mp4`, 53 `.mov`.** The field is called
`photos` but carries video too, and `.mov` in particular will not play everywhere. A
gallery that assumes `<img>` shows broken cells on one item in eight.

Counts per entry range **0–6**. URLs are **short-lived signed blob URLs** from
`yppms.blob.core.windows.net` (the only image host allowed by
[next.config.js](../next.config.js)) — they expire, so a cached page can show dead media.

## Proposed API surface

Not built yet; this is what the design should assume.

```
GET /kindy/student/harian                 → day index (newest first)
GET /kindy/student/harian?date=YYYY-MM-DD → one day
```

Both cookie-authenticated as the student, like every other `/kindy/student/*` route. The
index lists **only days that have a report**. Dates are `YYYY-MM-DD` strings — the DB
column is a bare `date` and the backend normalizes on the way out, so **no timezone
handling belongs in the UI.** Format via `formatDate` from
[src/lib/utils.ts](../src/lib/utils.ts), never `toLocaleDateString`.

## The five states to design

In build order. All five are in [harian-sample-data.json](harian-sample-data.json) under `days[]`.

1. **Rich day** — class report with photos + video, plus an individual note carrying two entries.
2. **Class only** — no personal note. 40% of days.
3. **Media-heavy + bilingual** — six items in one gallery, two of them video, note written in English.
4. **Hard day** — a candid individual note. The design has to hold difficult wording as gracefully as praise.
5. **No report** — the teacher wrote nothing. Weekend, holiday, or simply not filled in.

## Constraints inherited from the portal

- **425px column, mobile-first.** Root layout constrains everything to `max-w-app`.
- **Never truncate or shrink text** — no `truncate` / `line-clamp-*` / `overflow-hidden` on text, no shrinking a font to fit. Long teacher notes must wrap and grow taller. This is the rule that drifts most; see [src/components/ui/README.md](../src/components/ui/README.md).
- **Build from the existing shadcn/ui components** — `Card`, `Badge`, `Chip`, `SectionHeader`, `EmptyState`, `Spinner`, `ErrorAlert`, `Dialog`. Don't hand-roll what exists.
- **Light + dark mode both**, via the semantic tokens (`bg-card`, `text-muted-foreground`, `border-border`, `*-soft`). Brand green primary.
- **Indonesian audience** — copy in Bahasa Indonesia, dates via `formatDate` (`26-Jul-26`).

## Deferred (not this phase)

Deliberately excluded from this design:

- **Development tags** — report entries have `elements` / `subElements` fields backed by a
  5-element, 18-sub-element taxonomy. **All 318 reports leave them empty**; the teacher app
  can write them but nobody does. The API should simply not send them, and the design
  should not reserve space for them.
- **Attendance** (`KindyAttendance`) — `PRESENT` / `ABSENT` / `LATE`, 212 rows. Raises a
  product question worth settling separately: on an absent day the class report still
  exists, because it fanned out to the whole roster regardless.
- **Meals** (`KindyMeal` + `KindyMealConsumption`) — school-wide menu text and tray
  photos, plus a per-child `pct` on a five-step scale {0, 25, 50, 75, 100} that is
  frequently unrecorded.

Attendance and meals live in separate tables, so adding them later is additive — but
leaving room in the day layout for two more blocks is cheap insurance.

## A note on this document's data

Student names, teacher names and note text in the JSON are **synthetic stand-ins**,
written to match the real records in style, length, tone and formatting. Structure, file
extensions and frequency distributions are taken verbatim from production. Real
children's names and their teachers' observations are not in this file.
