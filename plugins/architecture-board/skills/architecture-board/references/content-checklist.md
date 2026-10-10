# Content checklist

Write the board as an outline before drawing anything. Example answers in
*italics* come from the template's fictional example, **Shelfwise**, an
e-book lending platform for public libraries. Use them to calibrate how
specific to be. Never copy their names or numbers onto a different system.

## 1. Header (every page)
- Title: the same on every page. A good pattern is `<System>: <Core concept>`,
  optionally followed by `(Revised for <Org>)` or a version or date.
  *Shelfwise (fictional): E-book Lending Platform*
- Subtitle: what this page shows. *Flow A: borrow an e-book, the last-copy
  race, and key decisions*
- The page counter is automatic. Leave `.hdr-page` empty.

## 2. Page plan
List the pages in order as `type · size · subtitle`. Only include pages that
carry a distinct view.

The template uses two A4-landscape pages. The first is the overview. The
second combines a sequence, an incident flow and the key decisions.

A larger board might be: overview (A3) → sequence: checkout → sequence:
return and hold promotion → incident flows → data & async → deployment →
failure & operations (portrait table) → key decisions.

## 3. Page types

### Overview / boundary map (always first)
| Region | Must state | Shelfwise example |
|---|---|---|
| External parties | who calls in or feeds data, and what each one brings | *Reader apps (card + PIN via library IdP); publisher feeds (nightly ONIX)* |
| Public entry / boundary | the only internet-facing component, as an ordered list of checks (a)..(n) | *Public API: (a) verify OIDC token (b) per-card 60 req/min (c) attach card_id, call services over mTLS* |
| Identity | who issues identities, what claims they carry, how keys are published | *one IdP per library; claims card_id, library_id, age_band; JWKS cached 1 h* |
| Private services | each service and its one-line responsibility, with concrete limits | *Lending: loan 14 days, max 5 per card; Holds: FIFO, pickup 72 h* |
| Owned stores | one owner per store, what it holds, where sensitive data lives | *Lending DB is the only store with card_id* |
| Async | events, their payload rules, delivery guarantee | *loan.created …; ids only; at-least-once, dedupe on event_id* |
| Failure modes | one line per critical dependency: behaviour, window, user impact | *Lending DB down → FAIL CLOSED on checkout; open books keep working* |
| SLOs / observability | targets, metrics, audit fields, alerts | *checkout p99 < 400 ms; alert if copies_available < 0* |
| Data contracts | envelope fields, forbidden fields, retention | *no card_id, name or email in any event; 7 days on the bus* |
| Legend | every line style and colour used | |

Rename the regions to fit the system. A data platform might use sources →
ingestion → processing → serving → consumers. Keep the ideas of an ordered
entry path, single-owner stores, and a failure line per dependency.

### Sequence (one per critical flow; two short flows can share a page)
- Lifelines: every participant, using the same names as on the overview.
- Messages are numbered and named after the flow. Include the happy path end
  to end, at least one rejection or `alt` path, self-calls for local checks,
  and error codes inline.
- Use frames (`alt`/`else`, `loop`, `opt`, `par`) for branches and retries,
  and notes for timing or state changes. *alt [0 rows: no copy] / else [1
  row: copy reserved]; note "after commit, asynchronously"*
- The last message, or a note, states the property the flow guarantees.
  *13 response (card details never leave Lending)*

### Threat / incident flow (red frame; 1–4 per page)
- Title: the scenario. *Two readers check out the last copy at once*
- A chain of 3–5 boxes. Highlight the control point, show the allowed or
  winning path in green and the blocked or losing path in red leading to the
  response it gets.
- Notes: the exact mechanism and the guarantee. *one conditional UPDATE …
  WHERE available > 0; idempotency key kept 24 h*
- Footer: the alert or audit rule, then "Fixes the incident class: …".
  *overselling licensed copies*

### Data & async
- Per store: its single owner, contents, PII class, retention, and who may
  read it.
- Per event: name, producer, consumers, payload fields, delivery guarantee,
  and outbox or idempotency key.

### Deployment / network
- Regions, clusters, namespaces, VPCs and subnets (public or private),
  ingress, egress and workload identity.
- The boundary again, at network level.

### Failure & operations
- A table with one row per dependency: failure → behaviour → cache window →
  user impact → alert → runbook.
- SLOs and alert thresholds as numbers.

### Changes vs original / key decisions (dark frame; last page or shared)
- Numbered items in green circles, one line each, starting with the
  decision. *Copies reserved by one conditional UPDATE, no distributed lock*
- Use "Changes vs original" when revising an earlier design and "Key
  decisions" for a first design. Past about 12 items, split into themed
  groups.

## 4. Self-review before rendering
- [ ] Every arrow is labelled, and every request that returns data has a labelled dashed response.
- [ ] Participant names match exactly across pages.
- [ ] Every module that applies to this board kind is covered, and none is padded in without reason.
- [ ] No vague adjectives are left where a number belongs.
- [ ] Untrusted input or credentials never appear inside the protected boundary.
- [ ] Every item in the changes or decisions list is visible somewhere on the board.
- [ ] Nothing from the template's example content is left unless it is true for this system.
