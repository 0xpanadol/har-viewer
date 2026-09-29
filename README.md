# HAR Viewer

A fast, private HAR file viewer for developers who spend too much time staring at network tabs.

Drop in a `.har` file — even a massive one — and get a searchable, filterable, keyboard-driven view of every request. No uploads, no servers: everything stays in your browser.

![HAR Viewer](screenshot.png)

## Why this exists

Browser DevTools are great until you need to share a network capture, dig through hundreds of requests offline, or compare traffic from a device you don't have in front of you. HAR files solve that, but most viewers either choke on large files or give you a wall of JSON. This one doesn't.

## Features

**Explore**

- **Request table** — virtualized, sortable, with columns that adapt to the space available. Pinned requests float to the top; duplicates and notes are flagged inline.
- **Faceted filters** — status class, method, type and domain with live counts and one-click “only”, plus duration and size ranges with quick presets.
- **Search** — URL, headers, bodies or everything; regex and invert modes. Matching rows show where the match was (headers, request/response body, cookies).
- **Time histogram** — requests over time, stacked by status. Drag across it to zoom the table into a time window.
- **Saved views** — name any filter combination and reapply it to any capture. Filters are also encoded in the URL for sharing.

**Inspect**

- **Inspector** — headers, payload (JSON, GraphQL, form, multipart), response, cookies (with URL/base64 decoding), timing and raw JSON, plus WebSocket messages.
- **Response viewer** — collapsible JSON tree with JSONPath breadcrumbs, syntax-highlighted source view for JSON/HTML/XML/CSS/JS, image previews, copy and download.
- **Find in request** — `⌘/Ctrl F` searches across the inspector with match count and next/previous navigation.
- **Timing breakdown** — each phase (queued, DNS, connect, TLS, send, TTFB, download) drawn where it happened.

**Analyze**

- **Waterfall** — every phase for every request, with DOMContentLoaded and Load markers.
- **Timeline** — per-domain lanes that show concurrency.
- **Overview** — totals, status and content-type breakdowns, a group-by pivot table, caching, compression, protocol and average-timing insights, slowest and largest requests.
- **Issues** — automated checks for failed requests, mixed content, slow TTFB, slow requests, redirect chains, oversized images, large responses, missing cache headers, likely render-blocking resources and duplicates. Passed checks are listed too.
- **Initiators** — the “who requested what” tree from `_initiator` data or Referer headers.
- **Compare** — load a second HAR to see what got faster, slower, added or removed.
- **Request diff** — header and body differences between any two requests.

**Act**

- **Copy as** cURL, fetch, axios, Python requests, HTTPie, wget or PowerShell (properly shell-quoted).
- **Export** HAR, sanitized HAR (credentials, cookies, secret-looking payloads and query params redacted), CSV, Postman collection, or cookies (Netscape `cookies.txt` / JSON) — for ticked rows or everything visible.
- **Bulk actions** — tick rows (Shift-click for ranges) for export, diff or delete. Deletes are undoable.
- **Notes & pins**, **replay** (subject to CORS), **merge** several HAR files into one timeline.
- **Command palette** (`⌘/Ctrl K`) for every action, plus full keyboard navigation (`?` lists shortcuts).

**Under the hood**

- Parsing runs in a **Web Worker** with streaming read progress, so huge files never freeze the UI.
- The session (including deletions) is kept in **IndexedDB**; filters, pins, notes and layout persist across reloads.
- Light, dark and system themes; works down to phone widths (sidebar and inspector become sheets).
- Validation flags malformed entries without blocking the load.

## Getting started

```bash
npm install
npm run dev
```

Open the printed URL, then drop a `.har` file on the page — or click **Explore a sample capture**.

## Scripts

| Script            | Purpose                                       |
| ----------------- | --------------------------------------------- |
| `npm run dev`     | Vite dev server                               |
| `npm run build`   | Type-check and build for production (`dist/`) |
| `npm run preview` | Serve the production build                    |
| `npm run check`   | Type-check, lint and unit-test in one go      |
| `npm test`        | Vitest unit tests for the domain layer        |
| `npm run lint`    | ESLint (incl. React Compiler rules)           |
| `npm run format`  | Prettier (with Tailwind class sorting)        |

## How to get a HAR file

- **Chrome / Edge** — DevTools → Network → enable _Preserve log_, reproduce, then _Export HAR_ (or right-click → _Save all as HAR with content_).
- **Firefox** — DevTools → Network → ⚙ → _Save All As HAR_.
- **Safari** — enable developer features, then Web Inspector → Network → _Export_.
- **Proxies** — Charles, Fiddler, Proxyman, HTTP Toolkit and mitmproxy all export HAR.

HAR files can contain cookies and tokens — use **Sanitized HAR** export before sharing one.

## Tech stack

- **React 19** with the **React Compiler**, **TypeScript 6** (strict, `noUncheckedIndexedAccess`)
- **Vite 8** (Rolldown) with route-level code splitting and a Web Worker parser
- **Tailwind CSS v4** with a token-based design system (OKLCH, light/dark)
- **Radix UI** primitives, **cmdk** (command palette), **sonner** (toasts), **lucide** icons
- **Zustand 5** (sliced store, memoized derived selectors), **TanStack Virtual**, **react-resizable-panels**
- **idb-keyval** for IndexedDB persistence; self-hosted **Geist** fonts (works offline)
- **Vitest**, **ESLint 10** (typescript-eslint, react-hooks), **Prettier**

## Project structure

```
src/
  app/              App root: session restore, theme, drag & drop, global shortcuts
  har/              Pure domain logic — parsing, filtering, search, metrics, issue checks,
    export/         compare, initiators, and exporters (HAR, CSV, Postman, snippets). Unit-tested.
  store/            Zustand slices (capture, filters, selection, UI) + memoized selectors
  services/         Side effects: worker parsing, IndexedDB session, exports, replay, URL state
  workers/          HAR parser Web Worker
  hooks/            Small reusable hooks (media queries, theme, element size, file drop)
  lib/              Framework-agnostic helpers (formatting, downloads, clipboard, platform)
  components/
    ui/             Design-system primitives (button, menus, dialog, tabs, command, …)
    *.tsx           Shared app components (status/method labels, key-value lists, charts)
  features/         One folder per product area:
    shell/          Header, view tabs, workspace layout, status bar, bulk-action bar
    filters/        Facet sidebar, search field, active-filter chips, saved views
    requests/       Virtualized table, row cells, time histogram, column menu
    inspector/      Request detail panel, tabs and response viewer
    waterfall/ timeline/ overview/ issues/ initiators/ compare/
    command/ dialogs/ shortcuts/ entry-actions/ welcome/
  styles/           Tailwind entry + design tokens
```

### Design system notes

All colors are semantic tokens in `src/styles/globals.css`, defined separately for light and dark. Chart colors (timing phases, status series) were checked for color-vision-deficiency separation and contrast in both modes. Status is never communicated by color alone — codes, labels and icons always accompany it.

## License

MIT
