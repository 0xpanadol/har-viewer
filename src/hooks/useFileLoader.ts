import { useState, useCallback } from 'react'
import { useHarStore } from '../store/harStore'
import { formatBytes } from '../utils/formatters'

export function useFileLoader() {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [loadText, setLoadText] = useState('')
  const loadHarData = useHarStore((s) => s.loadHarData)

  const loadFile = useCallback(
    async (file: File) => {
      setLoading(true)
      setLoadText(`Loading ${file.name} (${formatBytes(file.size)})...`)
      setProgress(0)

      try {
        const text = await readFileChunked(file, setProgress)
        setProgress(70)
        await new Promise((r) => setTimeout(r, 50))
        const data = JSON.parse(text)
        setProgress(90)
        loadHarData(data, file.name)
        setProgress(100)
      } catch (err) {
        alert('Failed to parse HAR file: ' + (err instanceof Error ? err.message : String(err)))
      } finally {
        setLoading(false)
      }
    },
    [loadHarData]
  )

  return { loading, progress, loadText, loadFile }
}

function readFileChunked(file: File, setProgress: (p: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > 50 * 1024 * 1024 && file.stream) {
      const reader = file.stream().getReader()
      const decoder = new TextDecoder()
      let result = ''
      let loaded = 0

      function pump() {
        reader.read().then(({ done, value }) => {
          if (done) {
            resolve(result)
            return
          }
          loaded += value.length
          setProgress(Math.min(60, (loaded / file.size) * 60))
          result += decoder.decode(value, { stream: true })
          if (loaded % (5 * 1024 * 1024) < value.length) {
            setTimeout(pump, 0)
          } else {
            pump()
          }
        }).catch(reject)
      }
      pump()
    } else {
      const reader = new FileReader()
      reader.onprogress = (e) => {
        if (e.lengthComputable) setProgress((e.loaded / e.total) * 60)
      }
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error)
      reader.readAsText(file)
    }
  })
}
