const IDENTIFIER = /^[A-Za-z_$][\w$]*$/

/** JSONPath-style child path: `$.data[0]["content-type"]`. */
export const childPath = (parent: string, key: string | number) =>
  typeof key === 'number'
    ? `${parent}[${key}]`
    : IDENTIFIER.test(key)
      ? `${parent}.${key}`
      : `${parent}[${JSON.stringify(key)}]`

/** Every object/array path — used by "collapse all". */
export function containerPaths(value: unknown, path = '$', out: string[] = []): string[] {
  if (value && typeof value === 'object') {
    out.push(path)
    if (Array.isArray(value)) value.forEach((v, i) => containerPaths(v, childPath(path, i), out))
    else for (const [k, v] of Object.entries(value)) containerPaths(v, childPath(path, k), out)
  }
  return out
}
