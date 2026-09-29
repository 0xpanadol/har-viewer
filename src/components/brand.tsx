import type { SVGProps } from 'react'
import { cn } from '@/lib/cn'

export const REPO_URL = 'https://github.com/0xpanadol/har-viewer'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-6', className)} aria-hidden>
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <rect x="7" y="9" width="10" height="3" rx="1.5" className="fill-primary-foreground" />
      <rect
        x="11"
        y="14.5"
        width="14"
        height="3"
        rx="1.5"
        className="fill-primary-foreground"
        opacity=".85"
      />
      <rect x="9" y="20" width="8" height="3" rx="1.5" className="fill-primary-foreground" opacity=".6" />
    </svg>
  )
}

/** Brand icons are not part of lucide; inlined from GitHub's mark. */
export function GithubIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6 0-3.2 0 0 1-.3 3.4 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.2.8.8 1.3 1.9 1.3 3.2 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1.1.9 2.2v3.3c0 .3.1.7.8.6A12 12 0 0 0 12 .3" />
    </svg>
  )
}
