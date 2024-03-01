export function ensureArray<T>(value: T | T[]): NonNullable<T>[] {
  return Array.isArray(value)
    ? (value as NonNullable<T>[])
    : value != null
    ? [value]
    : [];
}
