import { ChartGantt, Download, FileUp, FlaskConical, Lock, Search, TriangleAlert } from 'lucide-react'
import { GithubIcon, LogoMark, REPO_URL } from '@/components/brand'
import { Button } from '@/components/ui/button'
import { KbdCombo } from '@/components/ui/kbd'
import { MOD } from '@/lib/platform'
import { openSample } from '@/services/capture'
import { openFromPicker } from '../command/commands'
import { ThemeMenu } from '../shell/theme-menu'
import { CaptureGuide } from './capture-guide'

const FEATURES = [
  {
    icon: Search,
    title: 'Search everything',
    text: 'Filter by status, method, type or domain; search URLs, headers and bodies with regex.',
  },
  {
    icon: ChartGantt,
    title: 'See where time goes',
    text: 'Waterfall, per-domain timeline and a phase-by-phase timing breakdown.',
  },
  {
    icon: TriangleAlert,
    title: 'Find problems fast',
    text: 'Automatic checks for failures, slow TTFB, redirects, missing caching and more.',
  },
  {
    icon: Download,
    title: 'Share safely',
    text: 'Export as sanitized HAR, cURL, fetch, Postman or CSV — secrets redacted.',
  },
]

export function WelcomeScreen() {
  return (
    <div className="h-full overflow-y-auto">
      <header className="flex h-14 items-center justify-between px-5">
        <div className="flex items-center gap-2">
          <LogoMark />
          <span className="text-[13px] font-semibold">HAR Viewer</span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeMenu />
          <Button variant="ghost" size="icon-sm" asChild>
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" aria-label="GitHub repository">
              <GithubIcon />
            </a>
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-col items-center px-5 pt-[7vh] pb-16">
        <span className="inline-flex items-center gap-1.5 rounded-full border bg-panel px-3 py-1 text-xs text-muted-foreground">
          <Lock className="size-3.5 text-success" /> Runs entirely in your browser — files are never uploaded
        </span>
        <h1 className="mt-5 text-center text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Inspect network captures in seconds
        </h1>
        <p className="mt-3 max-w-xl text-center text-[15px] text-pretty text-muted-foreground">
          Open a HAR file to search every request, read headers and bodies, spot slow or failing calls, and
          diff captures — offline.
        </p>

        <button
          type="button"
          onClick={() => void openFromPicker()}
          className="group mt-10 flex w-full cursor-default flex-col items-center gap-4 rounded-xl border-2 border-dashed border-border-strong bg-panel px-6 py-12 transition-colors outline-none hover:border-primary/50 hover:bg-primary/[0.03] focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-ring/15"
        >
          <span className="grid size-12 place-items-center rounded-xl border bg-background shadow-sm transition-transform group-hover:-translate-y-0.5">
            <FileUp className="size-5 text-muted-foreground group-hover:text-primary" />
          </span>
          <span className="flex flex-col items-center gap-1">
            <span className="text-sm font-medium">
              Drop a HAR file here, or <span className="text-primary">browse</span>
            </span>
            <span className="text-xs text-muted-foreground">
              .har or .json of any size · drop several to merge them
            </span>
          </span>
          <KbdCombo keys={[MOD, 'O']} />
        </button>

        <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span>No file handy?</span>
          <Button variant="outline" size="sm" onClick={() => void openSample()}>
            <FlaskConical /> Explore a sample capture
          </Button>
        </div>

        <ul className="mt-14 grid w-full gap-x-8 gap-y-6 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <li key={f.title} className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg border bg-panel">
                <f.icon className="size-4 text-muted-foreground" />
              </span>
              <span>
                <span className="block text-[13px] font-medium">{f.title}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{f.text}</span>
              </span>
            </li>
          ))}
        </ul>

        <CaptureGuide className="mt-12 w-full" />
      </main>
    </div>
  )
}
