---
name: architecture-board
description: Produce a review-ready architecture "board": a dense, precise, multi-page PDF (plus HTML, per-page PNGs and Mermaid) with component and boundary maps, sequence diagrams, threat or incident flows, data, deployment and operations views, and a changes or key-decisions list. Works for any kind of system (security/auth, backend services, data pipelines, migrations, frontend/mobile, infrastructure), any page count and size, and any language including Arabic/RTL. Use whenever the user wants an architecture diagram, target architecture, trust boundary, system design doc, auth/identity flow, request flow or sequence diagram as a document, or wants to revise, critique or "fix" an existing architecture board, whiteboard or diagram. Also use when they say "architecture board", or "architecture PDF for review".
---

# Architecture Board

Produces a dense, precise board that a staff engineer or reviewer can approve
or reject in one sitting: numbered boxes, arrows that carry their contracts,
concrete numbers, and a failure line for each dependency.
`assets/template.html` contains a complete fictional example ("Shelfwise",
an e-book lending platform).

A board is not a slide deck or an essay. Every box states what a component
does, and every arrow states what crosses it and how. Every number is
concrete. Reviewers trust the board because nothing on it is vague.

**Everything below is a default.** If the user asks for something different
(a format, page size, language, colour scheme, rule or section), do what they
ask. The defaults exist so you don't have to decide things the user didn't
care about.

## Workflow

1. **Gather the design.** Sources include the user's description, an
   existing board, image, code or infra config, and the problem or incident
   that prompted the work. Identify the **board kind** (see below) and the
   outputs wanted.
2. **Fill the content model and plan the pages.** Use
   `references/content-checklist.md`. Write a plain outline, then a page
   plan: a list of pages, each with a page type, a size and a one-line
   subtitle. Where the source is silent, choose a sensible default, then
   label it `(example)` or put it in the decisions list. If a gap changes the
   design itself, ask the user instead of guessing.
3. **Lay out each page.** `references/visual-spec.md` covers the theme,
   formats, RTL, the arrow and sequence APIs, and a layout recipe for each
   page type.
4. **Build the HTML.** Copy `assets/template.html`. Its engine (arrows,
   sequences, Mermaid, page counter) is shared. Replace **all** of the
   example content: none of its names, numbers or decisions belong on
   another board unless they are true for this one. Add pages by duplicating
   `<section class="page">`. Connect boxes with `arrow()` and draw flows with
   `drawSequence()`, rather than hand-writing SVG coordinates.
5. **Render.** Run `scripts/render.sh board.html board.pdf`. It produces the
   PDF, `board-page-N.png` for each page, `board-flow-<id>.mmd` for each
   sequence, and layout warnings for overflowing text. Fix every warning,
   then **look at every PNG**. Watch for arrows passing through boxes,
   labels colliding, and empty or cramped pages. Re-render until it's clean,
   which usually takes two or three passes.
6. **Deliver.** Hand over the PDF and the editable HTML, plus the PNGs or
   Mermaid files if the user wants images, a wiki or docs-as-code.

## Board kinds: which rule modules apply

Core rules apply to every board. Modules apply when they fit the board's
kind. Use any combination, and skip a module when it would be noise.

| Kind | Modules usually on |
|---|---|
| Security / auth / gateway | Trust boundary, Failure, Observability, Threat flow |
| Backend services / platform | Failure, Observability; Trust boundary if there's an external edge |
| Data pipeline / analytics | Data contracts, Failure (late/duplicate/poison data), Observability |
| Migration / re-platforming | Revision (before/after), Failure (rollback), phased Deployment |
| Frontend / mobile | Client/server boundary, offline and failure states, Observability |
| Infrastructure / network | Deployment, Trust boundary (network zones), Failure |

### Core rules (every board)
- **Number things so people can point at them.** Number components 1..N and
  ordered steps (a)..(z). Name each flow ("Flow B") and number its messages,
  so a reviewer can write "B-7". Without numbers, a discussion can't refer to
  anything.
- **Label each arrow with its contract.** Write the operation plus the
  transport or security, for example `validate credential (mTLS + service
  identity)`. Label return arrows with their payload.
- **Use concrete parameters.** Write `TTL 5 min`, `p99 < 200 ms` or `retain
  30 days`, never "short-lived" or "fast". Mark illustrative numbers
  "(example)".
- **Keep boxes terse.** Use fragments and claim lists, not paragraphs. If a
  box grows past about 6 lines, split it or move the detail to its own page.

### Modules
- **Trust boundary.** Draw it as a red dashed outline. Say where external
  credentials or untrusted input end, and show that they are never
  forwarded inward.
- **Failure.** Give each critical dependency a behaviour when it fails
  (fail open or fail closed), how long caches keep serving, the user impact,
  and the alert.
- **Observability.** List what gets logged or audited, with field names,
  plus the metrics and SLOs, and which anomalies raise alerts.
- **Threat / incident flow.** Give each motivating incident a focused
  mini-flow showing where it is stopped. End with "Fixes the incident class:
  …".
- **Data contracts.** For each event or store: owner, schema, PII class,
  retention, delivery guarantee, idempotency key.
- **Revision.** Put a NEW badge and "(missing in the original)" on added
  parts, and add a numbered changes list. For a first design, use "Key
  decisions" instead.

## Pages: no fixed count, size or format

- **One purpose per page.** Use as many pages as the design needs. Split a
  page rather than shrinking text below 9 px, and don't pad a small design.
- **The page types** are overview, sequence, threat flow, data & async,
  deployment, failure & operations, and changes or decisions. Invent another
  type if the design calls for one.
- **Page sizes** are A4/A3/Letter in landscape or portrait, set per page and
  mixable in one PDF. Use A3 for a dense overview and portrait for long
  tables.
- **Outputs** are PDF (default), HTML, PNG per page and Mermaid per flow.
  For other targets (draw.io, Confluence, Structurizr), build the board
  first, then translate from the same content.
- **Language** can be anything. For Arabic and other right-to-left scripts,
  set `<html lang="ar" dir="rtl">` (see visual-spec).

## Files

- `references/content-checklist.md`: the page types, what each must contain,
  and a worked example of the reference's content. Read it in step 2.
- `references/visual-spec.md`: theme variables, page formats, RTL,
  typography, the `arrow()` and `drawSequence()` APIs, and layout recipes.
  Read it in steps 3 and 4.
- `assets/template.html`: the engine plus a two-page neutral example. Copy
  it and replace the content.
- `scripts/render.sh`: renders the PDF, PNGs and Mermaid, and checks the
  layout. It needs Node.js and uses the installed Chrome if present,
  otherwise it downloads Chromium once.
