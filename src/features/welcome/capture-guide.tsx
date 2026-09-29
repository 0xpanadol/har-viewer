import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Kbd } from '@/components/ui/kbd'
import { cn } from '@/lib/cn'
import type { ReactNode } from 'react'

const GUIDES: ReadonlyArray<{ id: string; label: string; steps: ReactNode[] }> = [
  {
    id: 'chrome',
    label: 'Chrome & Edge',
    steps: [
      <>
        Open DevTools with <Kbd>F12</Kbd> and select the <b>Network</b> tab.
      </>,
      <>
        Enable <b>Preserve log</b>, then reload and reproduce the problem.
      </>,
      <>
        Click <b>Export HAR</b> (the download arrow), or right-click any request →{' '}
        <b>Save all as HAR with content</b>.
      </>,
    ],
  },
  {
    id: 'firefox',
    label: 'Firefox',
    steps: [
      <>
        Open DevTools with <Kbd>F12</Kbd> and select <b>Network</b>.
      </>,
      <>Reload the page and reproduce the problem.</>,
      <>
        Open the <b>⚙ settings</b> menu in the toolbar → <b>Save All As HAR</b>.
      </>,
    ],
  },
  {
    id: 'safari',
    label: 'Safari',
    steps: [
      <>
        Turn on <b>Settings → Advanced → Show features for web developers</b>.
      </>,
      <>
        Open <b>Develop → Show Web Inspector</b> and select <b>Network</b>.
      </>,
      <>
        Reproduce the problem, then click <b>Export</b>.
      </>,
    ],
  },
  {
    id: 'proxy',
    label: 'Proxies',
    steps: [
      <>Charles, Fiddler, Proxyman, HTTP Toolkit and mitmproxy all export HAR.</>,
      <>Record the session while you reproduce the problem.</>,
      <>
        Use <b>File → Export</b> and pick the HAR format.
      </>,
    ],
  },
]

export function CaptureGuide({ className }: { className?: string }) {
  return (
    <section className={cn('rounded-xl border bg-panel', className)} aria-labelledby="capture-guide">
      <div className="px-5 pt-4">
        <h2 id="capture-guide" className="text-[13px] font-semibold">
          How to record a HAR file
        </h2>
      </div>
      <Tabs defaultValue="chrome">
        <TabsList className="border-b px-5">
          {GUIDES.map((g) => (
            <TabsTrigger key={g.id} value={g.id}>
              {g.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {GUIDES.map((g) => (
          <TabsContent key={g.id} value={g.id} className="outline-none">
            <ol className="flex flex-col gap-3 px-5 py-4">
              {g.steps.map((step, i) => (
                <li
                  key={i}
                  className="flex gap-3 text-[13px] leading-relaxed text-muted-foreground [&_b]:font-medium [&_b]:text-foreground"
                >
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-muted text-2xs font-semibold text-foreground tabular">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </TabsContent>
        ))}
      </Tabs>
      <p className="border-t px-5 py-3 text-xs text-subtle-foreground">
        HAR files can contain cookies and tokens. Use “Sanitized HAR” export before sharing one.
      </p>
    </section>
  )
}
