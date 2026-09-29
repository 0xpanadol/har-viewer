import type { HarCookie, HarEntry, HarLog, HarNameValue } from './types'

/** Seeded PRNG so the sample capture is identical on every load. */
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface Spec {
  method?: string
  url: string
  status?: number
  mime: string
  size: number
  at: number
  wait: number
  receive?: number
  body?: string
  encoding?: 'base64'
  request?: { mime: string; text: string }
  redirect?: string
  headers?: HarNameValue[]
  setCookies?: HarCookie[]
  connect?: boolean
  initiator?: string
}

const ORIGIN = 'https://shop.example.com'
const CDN = 'https://cdn.example-static.net'
const API = 'https://api.example.com'
const START = Date.parse('2026-03-03T06:57:35.120Z')

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40"><rect width="120" height="40" rx="8" fill="#5b4fe0"/><text x="60" y="26" font-family="system-ui" font-size="16" font-weight="700" text-anchor="middle" fill="#fff">shop</text></svg>`

const json = (value: unknown) => JSON.stringify(value)

const PRODUCTS = Array.from({ length: 12 }, (_, i) => ({
  id: `prd_${(1000 + i * 37).toString(36)}`,
  name: ['Trail Runner', 'Canvas Tote', 'Wool Beanie', 'Rain Shell', 'Field Watch', 'Desk Lamp'][i % 6],
  price: { amount: 2900 + i * 450, currency: 'USD' },
  inStock: i % 5 !== 3,
  tags: i % 2 ? ['new', 'featured'] : ['sale'],
  rating: Math.round((3.6 + (i % 7) * 0.2) * 10) / 10,
}))

function specs(): Spec[] {
  const list: Spec[] = [
    {
      url: 'http://shop.example.com/',
      status: 301,
      mime: 'text/html',
      size: 0,
      at: 0,
      wait: 38,
      redirect: `${ORIGIN}/`,
      connect: true,
    },
    {
      url: `${ORIGIN}/`,
      status: 302,
      mime: 'text/html',
      size: 0,
      at: 60,
      wait: 44,
      redirect: `${ORIGIN}/en-us/`,
      connect: true,
    },
    {
      url: `${ORIGIN}/en-us/`,
      mime: 'text/html; charset=utf-8',
      size: 48_210,
      at: 120,
      wait: 212,
      receive: 34,
      body: `<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <title>Shop — Everyday gear</title>\n  <link rel="stylesheet" href="${CDN}/assets/app.4f2a.css">\n  <script src="${CDN}/assets/vendor.91bc.js"></script>\n</head>\n<body>\n  <!-- server-rendered shell -->\n  <div id="root" data-page="home"></div>\n  <script type="module" src="${CDN}/assets/app.7d1e.js"></script>\n</body>\n</html>`,
      setCookies: [
        {
          name: 'session_id',
          value: 'c2Vzc2lvbjo4ZjNhYjE5ZC0wYzQyLTRlMTEtYjc0Yy0xZGE4ZjI2YTAwMDE=',
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: 'Lax',
        },
        { name: 'locale', value: 'en-US', path: '/' },
      ],
    },
    {
      url: `${CDN}/assets/app.4f2a.css`,
      mime: 'text/css',
      size: 86_400,
      at: 380,
      wait: 64,
      receive: 22,
      body: ':root{--brand:#5b4fe0}body{margin:0;font-family:system-ui}',
      connect: true,
      initiator: `${ORIGIN}/en-us/`,
    },
    {
      url: `${CDN}/assets/vendor.91bc.js`,
      mime: 'application/javascript',
      size: 412_880,
      at: 382,
      wait: 71,
      receive: 180,
      body: '/*! vendor bundle */\n(()=>{"use strict";var e={};})();',
      initiator: `${ORIGIN}/en-us/`,
    },
    {
      url: `${CDN}/assets/app.7d1e.js`,
      mime: 'application/javascript',
      size: 198_340,
      at: 386,
      wait: 69,
      receive: 96,
      body: 'import{r as e}from"./vendor.91bc.js";e(document.getElementById("root"));',
      initiator: `${ORIGIN}/en-us/`,
    },
    {
      url: `${CDN}/fonts/inter-var.woff2`,
      mime: 'font/woff2',
      size: 98_220,
      at: 480,
      wait: 58,
      receive: 41,
      headers: [],
      initiator: `${CDN}/assets/app.4f2a.css`,
    },
    {
      url: `${CDN}/img/logo.svg`,
      mime: 'image/svg+xml',
      size: LOGO_SVG.length,
      at: 520,
      wait: 40,
      body: btoa(LOGO_SVG),
      encoding: 'base64',
      initiator: `${ORIGIN}/en-us/`,
    },
    {
      method: 'OPTIONS',
      url: `${API}/v2/graphql`,
      status: 204,
      mime: 'text/plain',
      size: 0,
      at: 900,
      wait: 96,
      connect: true,
      initiator: `${CDN}/assets/app.7d1e.js`,
    },
    {
      method: 'POST',
      url: `${API}/v2/graphql`,
      mime: 'application/json',
      size: 6_420,
      at: 1010,
      wait: 318,
      body: json({ data: { featured: { edges: PRODUCTS.slice(0, 6).map((node) => ({ node })) } } }),
      request: {
        mime: 'application/json',
        text: json({
          operationName: 'FeaturedProducts',
          query:
            'query FeaturedProducts($first: Int!) {\n  featured(first: $first) {\n    edges { node { id name price { amount currency } inStock } }\n  }\n}',
          variables: { first: 6 },
        }),
      },
      initiator: `${CDN}/assets/app.7d1e.js`,
    },
    {
      url: `${API}/v2/products?category=outdoor&page=1&limit=12`,
      mime: 'application/json',
      size: 14_870,
      at: 1030,
      wait: 1240,
      receive: 60,
      body: json({
        data: PRODUCTS,
        page: 1,
        total: 148,
        next: '/v2/products?category=outdoor&page=2&limit=12',
      }),
      initiator: `${CDN}/assets/app.7d1e.js`,
    },
    {
      url: `${API}/v2/me`,
      status: 401,
      mime: 'application/json',
      size: 88,
      at: 1040,
      wait: 92,
      body: json({ error: 'unauthorized', message: 'Missing or expired access token' }),
      initiator: `${CDN}/assets/app.7d1e.js`,
    },
    {
      url: `${API}/v2/cart`,
      mime: 'application/json',
      size: 240,
      at: 1050,
      wait: 146,
      body: json({ id: 'cart_7Qx2', items: [], subtotal: { amount: 0, currency: 'USD' } }),
      initiator: `${CDN}/assets/app.7d1e.js`,
    },
    {
      url: `${API}/v2/cart`,
      mime: 'application/json',
      size: 240,
      at: 1890,
      wait: 131,
      body: json({ id: 'cart_7Qx2', items: [], subtotal: { amount: 0, currency: 'USD' } }),
      initiator: `${CDN}/assets/app.7d1e.js`,
    },
    {
      url: `${API}/v2/recommendations?user=anon`,
      status: 503,
      mime: 'application/json',
      size: 112,
      at: 1400,
      wait: 3020,
      body: json({ error: 'upstream_timeout', retryAfter: 30 }),
      initiator: `${CDN}/assets/app.7d1e.js`,
    },
    {
      url: `${CDN}/assets/legacy-carousel.js`,
      status: 404,
      mime: 'text/html',
      size: 1_220,
      at: 700,
      wait: 52,
      body: '<h1>404 Not Found</h1>',
      initiator: `${ORIGIN}/en-us/`,
    },
    {
      url: 'http://tracker.example-ads.com/pixel.gif?cid=8812&evt=pageview',
      mime: 'image/gif',
      size: 43,
      at: 1600,
      wait: 210,
      connect: true,
      initiator: `${CDN}/assets/app.7d1e.js`,
    },
    {
      method: 'POST',
      url: 'https://events.example-analytics.io/v1/batch',
      mime: 'application/json',
      size: 20,
      at: 2100,
      wait: 88,
      body: json({ accepted: 3 }),
      request: {
        mime: 'application/json',
        text: json({
          events: [
            { type: 'page_view', path: '/en-us/' },
            { type: 'impression', ids: ['prd_rs', 'prd_s5'] },
            { type: 'web_vitals', lcp: 1840, cls: 0.03 },
          ],
        }),
      },
      connect: true,
      initiator: `${CDN}/assets/app.7d1e.js`,
    },
    {
      method: 'POST',
      url: `${API}/v2/newsletter`,
      status: 201,
      mime: 'application/json',
      size: 64,
      at: 5200,
      wait: 180,
      body: json({ ok: true, id: 'sub_19aa' }),
      request: {
        mime: 'application/x-www-form-urlencoded',
        text: 'email=alex%40example.com&source=footer&consent=true',
      },
      initiator: `${CDN}/assets/app.7d1e.js`,
    },
  ]

  PRODUCTS.forEach((p, i) => {
    list.push({
      url: `${CDN}/img/products/${p.id}@2x.webp`,
      mime: 'image/webp',
      size: 18_000 + ((i * 7919) % 42_000),
      at: 1350 + i * 35,
      wait: 90 + ((i * 53) % 160),
      receive: 20 + (i % 4) * 12,
      initiator: `${CDN}/assets/app.7d1e.js`,
    })
  })
  list.push({
    url: `${CDN}/img/hero/spring-collection.jpg`,
    mime: 'image/jpeg',
    size: 684_000,
    at: 1300,
    wait: 120,
    receive: 540,
    initiator: `${CDN}/assets/app.4f2a.css`,
  })

  for (let i = 0; i < 8; i++) {
    list.push({
      url: `${API}/v2/inventory/${PRODUCTS[i]!.id}`,
      mime: 'application/json',
      size: 96,
      at: 2600 + i * 180,
      wait: 70 + ((i * 31) % 90),
      body: json({ id: PRODUCTS[i]!.id, available: 3 + i, warehouse: 'us-east' }),
      initiator: `${CDN}/assets/app.7d1e.js`,
    })
  }
  return list
}

function buildEntry(spec: Spec, rand: () => number): HarEntry {
  const status = spec.status ?? 200
  const blocked = Math.round(rand() * 6 * 10) / 10
  const dns = spec.connect ? 8 + Math.round(rand() * 20) : -1
  const ssl = spec.connect && spec.url.startsWith('https') ? 18 + Math.round(rand() * 25) : -1
  const connect = spec.connect ? Math.max(0, ssl) + 10 + Math.round(rand() * 14) : -1
  const send = Math.round(rand() * 3 * 10) / 10 + 0.2
  const receive = spec.receive ?? Math.max(1, Math.round(spec.size / 60_000)) + Math.round(rand() * 3)
  const time = Math.max(0, blocked) + Math.max(0, dns) + Math.max(0, connect) + send + spec.wait + receive
  const url = new URL(spec.url)
  const method = spec.method ?? 'GET'
  const compressed = /json|javascript|css|html/.test(spec.mime) && spec.size > 1024

  const responseHeaders: HarNameValue[] = [
    { name: 'content-type', value: spec.mime },
    { name: 'date', value: new Date(START + spec.at).toUTCString() },
    ...(compressed ? [{ name: 'content-encoding', value: 'br' }] : []),
    ...(spec.headers ??
      (/css|javascript|image|font/.test(spec.mime)
        ? [{ name: 'cache-control', value: 'public, max-age=31536000, immutable' }]
        : [])),
    ...(spec.redirect ? [{ name: 'location', value: spec.redirect }] : []),
    ...(spec.setCookies ?? []).map((c) => ({
      name: 'set-cookie',
      value: `${c.name}=${c.value}; Path=${c.path ?? '/'}`,
    })),
    { name: 'x-request-id', value: `req_${Math.floor(rand() * 1e12).toString(36)}` },
  ]

  const requestHeaders: HarNameValue[] = [
    { name: ':authority', value: url.host },
    { name: 'accept', value: /json/.test(spec.mime) ? 'application/json' : '*/*' },
    { name: 'accept-encoding', value: 'gzip, deflate, br, zstd' },
    {
      name: 'user-agent',
      value:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
    },
    ...(spec.initiator ? [{ name: 'referer', value: spec.initiator }] : []),
    ...(url.host === 'api.example.com'
      ? [{ name: 'authorization', value: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhbm9uIn0.sig' }]
      : []),
    ...(spec.request ? [{ name: 'content-type', value: spec.request.mime }] : []),
  ]

  const cookies =
    url.host === 'shop.example.com' || url.host === 'api.example.com'
      ? [
          { name: 'session_id', value: 'c2Vzc2lvbjo4ZjNhYjE5ZC0wYzQyLTRlMTEtYjc0Yy0xZGE4ZjI2YTAwMDE=' },
          { name: 'locale', value: 'en-US' },
        ]
      : []

  return {
    startedDateTime: new Date(START + spec.at).toISOString(),
    time,
    request: {
      method,
      url: spec.url,
      httpVersion: 'h2',
      headers: requestHeaders,
      queryString: [...url.searchParams].map(([name, value]) => ({ name, value })),
      cookies: spec.at > 200 ? cookies : [],
      headersSize: -1,
      bodySize: spec.request?.text.length ?? 0,
      ...(spec.request ? { postData: { mimeType: spec.request.mime, text: spec.request.text } } : {}),
    },
    response: {
      status,
      statusText: '',
      httpVersion: url.protocol === 'http:' ? 'http/1.1' : 'h2',
      headers: responseHeaders,
      cookies: spec.setCookies ?? [],
      content: {
        size: spec.size,
        mimeType: spec.mime.split(';')[0]!,
        ...(spec.body ? { text: spec.body } : {}),
        ...(spec.encoding ? { encoding: spec.encoding } : {}),
      },
      redirectURL: spec.redirect ?? '',
      headersSize: 320,
      bodySize: compressed ? Math.round(spec.size * 0.28) : spec.size,
    },
    cache: {},
    timings: { blocked, dns, connect, ssl, send, wait: spec.wait, receive },
    serverIPAddress: `203.0.113.${10 + (url.host.length % 40)}`,
    connection: String(1000 + (url.host.length % 7)),
    _initiator: spec.initiator ? { type: 'parser', url: spec.initiator } : { type: 'other' },
  }
}

export function createSampleLog(): HarLog {
  const rand = mulberry32(0x4a5)
  const entries = specs()
    .sort((a, b) => a.at - b.at)
    .map((spec) => buildEntry(spec, rand))

  entries.push({
    ...buildEntry(
      {
        url: 'wss://realtime.example.com/socket',
        status: 101,
        mime: 'text/plain',
        size: 0,
        at: 2400,
        wait: 60,
        initiator: `${CDN}/assets/app.7d1e.js`,
      },
      rand,
    ),
    _webSocketMessages: [
      { type: 'send', time: 0.001, opcode: 1, data: json({ op: 'subscribe', channel: 'inventory' }) },
      { type: 'receive', time: 0.12, opcode: 1, data: json({ op: 'ack', channel: 'inventory' }) },
      { type: 'receive', time: 2.4, opcode: 1, data: json({ op: 'update', id: 'prd_rs', available: 2 }) },
      { type: 'send', time: 30.0, opcode: 1, data: json({ op: 'ping' }) },
      { type: 'receive', time: 30.05, opcode: 1, data: json({ op: 'pong' }) },
    ],
  })

  return {
    version: '1.2',
    creator: { name: 'HAR Viewer sample', version: '2.0' },
    pages: [
      {
        id: 'page_1',
        title: `${ORIGIN}/en-us/`,
        startedDateTime: new Date(START).toISOString(),
        pageTimings: { onContentLoad: 1180, onLoad: 2040 },
      },
    ],
    entries,
  }
}
