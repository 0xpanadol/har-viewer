# HAR Viewer

A fast, offline HAR file viewer built for developers who spend too much time staring at network tabs.

Drop in a `.har` file - even a massive one - and get a clean, searchable, filterable view of every request. No uploads, no servers, everything stays in your browser.

![HAR Viewer](../har-viewer-after-refresh.png)

## Why this exists

Browser DevTools are great until you need to share a network capture, dig through hundreds of requests offline, or compare traffic from a device you don't have in front of you. HAR files solve that, but most viewers either choke on large files or give you a wall of JSON. This one doesn't.

## Features

- **Handles large files** - Chunked file reading and virtual scrolling. Tested with 180+ entry captures, designed to handle thousands.
- **Filter everything** - By HTTP method (GET, POST, etc.), status code (2xx, 3xx, 4xx, 5xx), content type (js, img, json, html, css...), or just type in the search bar.
- **Full request inspection** - Headers, payload, response body, cookies (with auto-decoding), timing breakdown with waterfall visualization, and raw HAR JSON.
- **Export what you need** - Select one request, a handful, or all filtered results and export as a valid `.har` file. Right-click for copy as cURL, copy URL, copy response body.
- **Session persistence** - Refresh the page and pick up exactly where you left off. Filters, selected entry, scroll position, panel width, active tab - all of it. HAR data is stored in IndexedDB so even large files survive a reload.
- **Keyboard friendly** - Arrow keys to navigate, Escape to close panels, Ctrl+F to search.
- **Dark theme** - Easy on the eyes during those late-night debugging sessions.

## Getting started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

Then open it in your browser and drop a `.har` file on the page. That's it.

## How to get a HAR file

- **Chrome/Edge**: DevTools → Network tab → right-click → "Save all as HAR with content"
- **Firefox**: DevTools → Network tab → gear icon → "Save All As HAR"
- **HTTP Toolkit / Charles / Fiddler**: Export as HAR from the file menu

## Tech stack

- React 19 + TypeScript
- Vite for builds
- Zustand for state management (with localStorage + IndexedDB persistence)
- TanStack Virtual for virtual scrolling
- Zero runtime CSS dependencies - just plain CSS with custom properties

## Project structure

```
src/
  components/       # UI components (13 files)
    tabs/           # Detail panel tabs (Headers, Payload, Response, Cookies, Timing, Raw)
  hooks/            # Custom hooks (file loading, filtered entries)
  store/            # Zustand store with persistence
  utils/            # Types, formatters, parsers, exporters, IndexedDB storage
```

## License

MIT
