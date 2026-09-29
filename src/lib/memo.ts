/**
 * Memoizes on reference equality of each argument. Used for derived store selectors so
 * every subscriber shares one computation and receives a stable reference.
 */
export function memoizeOne<Args extends unknown[], R>(fn: (...args: Args) => R): (...args: Args) => R {
  let lastArgs: Args | null = null
  let lastResult: R
  return (...args: Args) => {
    if (lastArgs && args.length === lastArgs.length && args.every((arg, i) => Object.is(arg, lastArgs![i]))) {
      return lastResult
    }
    lastArgs = args
    lastResult = fn(...args)
    return lastResult
  }
}
