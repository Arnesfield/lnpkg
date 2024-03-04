export function errorLog(error: unknown): unknown {
  return error instanceof Error ? error.toString() : error;
}

export function isNoEntryError(error: unknown): error is NodeJS.ErrnoException {
  return (
    error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT'
  );
}
