/** Round axis ticks (1/2/5 × 10ⁿ) covering [0, max]. */
export function niceTicks(max: number, target = 6): number[] {
  if (max <= 0) return [0]
  const rough = max / target
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? rough
  const ticks: number[] = []
  for (let t = 0; t <= max + step * 0.001; t += step) ticks.push(t)
  return ticks
}
