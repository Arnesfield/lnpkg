export function errorLog(error: unknown): unknown {
  return error instanceof Error ? error.toString() : error;
}
