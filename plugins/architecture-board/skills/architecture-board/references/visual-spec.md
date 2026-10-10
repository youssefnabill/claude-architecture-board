# Visual spec

## Theme
Everything is driven by CSS variables in `:root` in `assets/template.html`.
To apply a brand, change those variables and nothing else. Arrow and
sequence colours read the same variables.

| Variable | Role (keep the meaning stable across a board) |
|---|---|
| `--c-dark` / `--bg-neutral` | actors, main flow, neutral boxes |
| `--c-blue` / `--bg-blue` | identity / owning domain, identity calls |
| `--c-green` / `--bg-green` | keys, signing, "allowed" paths, changes-list badges |
| `--c-red` / `--bg-red` / `--bg-pink` | trust boundary, failure, threats, rejection paths |
| `--c-purple` / `--bg-purple` | async / events |
| `--c-amber` / `--bg-amber` | NEW, legacy / migration, notes |
| `--c-gray` | telemetry, audit, frames |
| `--font`, `--min-font` | font stack (includes Arabic system fonts), smallest allowed size |

- **Dark theme:** `<html data-theme="dark">`. It suits screens. For print, keep
  the light theme unless the user asks.
- **Extra roles:** add a variable pair (`--c-teal`, `--bg-teal`) and refer to
  it by name, as in `color: "teal"`, or pass any `#hex`.
- **Box classes:** `neutral`, `new`, `boundary`, `danger`, `identity`,
  `crypto`, `private`, `async`, `legacy`, `highlight`, `white`; `inner` for
  nested boxes; `center` to centre text.

## Page formats
| Class on `<section class="page …">` | Format | Canvas (px) |
|---|---|---|
| *(none)* | A4 landscape | 1170 × 827 |
| `a4-portrait` | A4 portrait | 827 × 1170 |
| `a3` | A3 landscape | 1654 × 1170 |
| `a3-portrait` | A3 portrait | 1170 × 1654 |
| `letter` | US Letter landscape | 1100 × 850 |
| `letter-portrait` | US Letter portrait | 850 × 1100 |

Sizes can be mixed in one PDF. For another format, add an `@page name {
size: …; margin: 0 }` rule and a class whose canvas is the paper size in CSS
px divided by 0.96.

## Typography
| Element | Size / weight | Colour |
|---|---|---|
| Page title | 20 px / 700 | `--ink` |
| Subtitle, page counter | 11 px | `--muted` |
| Box title (`h3` / `h4`) | 12 / 11 px, 700 | role colour or `--ink` |
| Box body | 10 px, line-height 1.3 | `--ink` |
| Arrow / message labels | 9 px (600 for contracts) | arrow colour |
| Notes | 9 px | `--faint` |

The minimum is **9 px** (`--min-font`). If something only fits below that,
split it onto another page.

## Right-to-left (Arabic, Hebrew, Persian, Urdu)
- Use `<html lang="ar" dir="rtl">`. Headers, CSS grid and flex layouts, and
  box text mirror automatically.
- Each SVG label takes its direction from its own script, so English labels
  like "1 request" stay intact on an RTL page.
- Wrap embedded Latin, code or numbers in Arabic text with `<bdi>`, as in
  `حد المعدل <bdi>100 req/s</bdi>`.
- Absolutely positioned boxes use physical `left`/`top`. On an RTL board,
  place the flow right-to-left yourself (callers on the right), or use a CSS
  grid, which mirrors on its own.
- Mixed-language boards work. Keep technical identifiers (endpoints, claims,
  field names) in Latin script.

## Laying out boxes
- Use any CSS. Absolute coordinates (`left/top/width/height`) give exact
  control. A CSS grid or flex container inside the page is faster for
  regular layouts; give its boxes `class="box static …"`.
- Give every box that an arrow touches an `id`.
- Leave 25–40 px corridors between columns for arrow labels, and at least
  8 px between stacked boxes so arrowheads stay visible.

## Arrows: `arrow(from, to, opts)`
Arrows are drawn from the boxes' real positions, so moving or resizing a box
never breaks them. Call them in the script block after the engine.

| Option | Values | Default |
|---|---|---|
| `from`, `to` | `top` `right` `bottom` `left` | guessed from positions |
| `fromAt`, `toAt` | 0..1 along the side | .5 |
| `straight` | `true` keeps the source coordinate, giving a perfectly level or plumb line | false |
| `route` | `orthogonal`, `straight` (diagonal allowed), `curve` | orthogonal |
| `via` | x or y of the elbow (for routing around things) | midpoint |
| `color` | theme name or `#hex` | dark |
| `style` | `solid`, `dashed` (responses), `dotted` (telemetry) | solid |
| `both` | arrowheads at both ends | false |
| `label` / `labelBelow` | text; `\|` = line break; above/right and below/left of the longest segment | — |
| `labelWeight` | 400 for plain notes, 600 for contracts | 600 |

Meaning: solid for a request, dashed in the request's colour for its
response, red dashed for a rejection, gray dotted for audit or telemetry.

**Arrows do not avoid obstacles.** If one passes through a box it doesn't
connect to, choose different `from`/`to` sides, set `via` to route around the
box, or move a box. The PNG review in step 5 is where you catch this.

Hand-written SVG is still allowed for one-off shapes such as brackets,
zones and icons. Add it inside an `<svg class="overlay">`.

## Sequence diagrams: `drawSequence(svgId, lifelines, messages, cfg)`
Put an empty `<svg class="overlay" id="seq-x"></svg>` on the page, then call:

```js
drawSequence("seq-x",
  [["app","Reader app"], ["api","Public API"], ["lend","Lending"]], // add an x to pin a position; omit it to space evenly
  [
    ["app","api","req","dark","1 POST /loans {title_id}"],
    ["api","api","self","dark","2 verify token|limit 60 / min"],    // | = line break
    ["api","app","alt","red","3 alt: 429 over limit"],
    ["api","lend","req","dark","4 checkout(card_id, title_id)"],
    { frame: "alt", label: "no copy", span: 2 },                   // wraps the next 2 message rows
    ["lend","api","resp","dark","5 409 + hold position"],
    { else: "copy reserved" },
    ["lend","api","resp","dark","6 201 loan + license"],
    { note: "after commit, asynchronously", over: ["api","lend"] },
  ],
  { bottom: 800 });                                                // lifeline end; default leaves room for boxes below
```
- Kinds: `req` (solid), `resp` (dashed), `alt` (dashed, use red), `self`
  (loop).
- Frames: `loop`, `alt` with `else`, `opt`, `par`, `critical`, `break`.
  Frames can be nested.
- Any number of participants is allowed, and the head width shrinks to fit.
  More than about 12 gets hard to read, so split by sub-system.
- Rows shrink to fit the space. A console warning, which the renderer
  reports, means there are too many rows for the page, so split the flow
  ("Flow A (1/2)").
- Every sequence is exported as Mermaid (`board-flow-<id>.mmd`) for wikis and
  docs-as-code.
- Not supported: activation bars, and arrows between two different
  sequence diagrams.

## Layout recipes

### Overview (rows, A4 landscape): the template's layout
- Left column (x 16–196): external parties stacked (callers, CDN, external
  feeds), legend underneath.
- Top row (y 70–180): the public entry / boundary box in the middle, the
  identity provider on the right.
- Middle (y 215–460): one private-zone box holding a row of services, with
  the store each one owns directly beneath it and short ownership arrows.
- Event band (y 480–542): the event bus, with downstream consumers to the
  right.
- Bottom row (y 580–815): failure modes, SLOs & observability, data
  contracts.
- Leave 60 px corridors between columns for contract labels.

### Overview alternatives
- **Columns:** inputs left, core centre, dependencies right, cross-cutting
  boxes along the bottom. Suits request pipelines with a long ordered list
  of checks.
- **Layers:** horizontal bands (edge → services → data → platform). Suits
  infrastructure and deployment boards.
- For more than about 12 components, use A3, or split into one overview
  page per zone.

### Shared page (sequence + threat flow + changes)
- Sequence at y 60–565 (`bottom: 568`). The incident frame sits bottom-left
  at x 16–625, y 590–815. The decisions frame sits bottom-right at x
  640–1155.

### Full-page sequence
- `drawSequence(id, …, { bottom: pageHeight - 25 })`. Up to about 22 rows
  fit on A4 landscape, and more on A3 or portrait.

### Threat page
- Two frames side by side, or a 2×2 grid of frames.

### Data / deployment / operations
- Use the same box and arrow vocabulary. Put tables in
  `<table class="board">` inside a box.

## Rendering checks
The renderer reports text overflowing a box and boxes extending past the
page edge. Then look at every PNG for:
- arrows crossing labels or passing through unrelated boxes
- labels colliding with each other
- pages that are cramped (split them) or mostly empty (merge them)
- the same title on every page, and the right page total
