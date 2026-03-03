import { useHarStore } from '../store/harStore'
import { formatBytes, formatTime, statusClass } from '../utils/formatters'
import type { ParsedEntry, HarHeader } from '../utils/types'

export function DiffPanel() {
  const diffEntries = useHarStore((s) => s.diffEntries)
  const allEntries = useHarStore((s) => s.allEntries)
  const setOverlayPanel = useHarStore((s) => s.setOverlayPanel)
  const setDiffEntries = useHarStore((s) => s.setDiffEntries)

  if (!diffEntries) return null
  const a = allEntries.find((e) => e._idx === diffEntries[0])
  const b = allEntries.find((e) => e._idx === diffEntries[1])
  if (!a || !b) return null

  const close = () => { setDiffEntries(null); setOverlayPanel('none') }

  return (
    <div className="overlay-panel diff-panel">
      <div className="overlay-header">
        <span className="overlay-title">Diff: #{a._idx + 1} vs #{b._idx + 1}</span>
        <button className="detail-close" onClick={close}>✕</button>
      </div>
      <div className="overlay-body">
        <div className="diff-grid">
          <div className="diff-col">
            <div className="diff-col-title">Request #{a._idx + 1}</div>
            <EntryInfo entry={a} />
          </div>
          <div className="diff-col">
            <div className="diff-col-title">Request #{b._idx + 1}</div>
            <EntryInfo entry={b} />
          </div>
        </div>

        <div className="section">
          <div className="section-title">Header Differences</div>
          <HeaderDiff
            label="Request Headers"
            headersA={a._raw.request?.headers || []}
            headersB={b._raw.request?.headers || []}
          />
          <HeaderDiff
            label="Response Headers"
            headersA={a._raw.response?.headers || []}
            headersB={b._raw.response?.headers || []}
          />
        </div>

        <div className="section">
          <div className="section-title">Response Body</div>
          <div className="diff-grid">
            <div className="diff-col">
              <pre className="diff-body">{(a._raw.response?.content?.text || '(empty)').slice(0, 2000)}</pre>
            </div>
            <div className="diff-col">
              <pre className="diff-body">{(b._raw.response?.content?.text || '(empty)').slice(0, 2000)}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function EntryInfo({ entry }: { entry: ParsedEntry }) {
  return (
    <table className="kv-table">
      <tbody>
        <tr><td className="kv-key">URL</td><td className="kv-val" style={{ fontSize: 10, wordBreak: 'break-all' }}>{entry.url}</td></tr>
        <tr><td className="kv-key">Method</td><td className="kv-val">{entry.method}</td></tr>
        <tr><td className="kv-key">Status</td><td className={`kv-val ${statusClass(entry.status)}`}>{entry.status} {entry.statusText}</td></tr>
        <tr><td className="kv-key">Size</td><td className="kv-val">{formatBytes(entry.size)}</td></tr>
        <tr><td className="kv-key">Time</td><td className="kv-val">{formatTime(entry.time)}</td></tr>
      </tbody>
    </table>
  )
}

function HeaderDiff({ label, headersA, headersB }: { label: string; headersA: HarHeader[]; headersB: HarHeader[] }) {
  const mapA = new Map(headersA.map((h) => [h.name.toLowerCase(), h.value]))
  const mapB = new Map(headersB.map((h) => [h.name.toLowerCase(), h.value]))
  const allKeys = [...new Set([...mapA.keys(), ...mapB.keys()])].sort()

  const diffs = allKeys.filter((k) => mapA.get(k) !== mapB.get(k))
  if (diffs.length === 0) return <div className="issues-empty">{label}: identical</div>

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 4 }}>{label} ({diffs.length} differences)</div>
      <table className="kv-table">
        <tbody>
          {diffs.map((k) => {
            const va = mapA.get(k)
            const vb = mapB.get(k)
            return (
              <tr key={k}>
                <td className="kv-key">{k}</td>
                <td className="kv-val">
                  <div className="diff-val-a">{va ?? <em>missing</em>}</div>
                  <div className="diff-val-b">{vb ?? <em>missing</em>}</div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
