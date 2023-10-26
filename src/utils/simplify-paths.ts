import path from 'path';

/**
 * filter out paths that are already included in another path.
 * e.g. Filter out file paths when the entire directory path is already included.
 * @param paths Paths to simplify.
 * @returns The simplified paths.
 */
export function simplifyPaths(paths: string[]): string[] {
  paths = Array.from(paths);
  if (paths.length <= 1) {
    return paths;
  }
  // sort: intentionally mutate array
  const simplifiedPaths = paths.sort().splice(0, 1);
  let previous = simplifiedPaths[0];
  for (const value of paths) {
    let a = path.dirname(value);
    a += a.endsWith(path.sep) ? '' : path.sep;
    const b = previous + (previous.endsWith(path.sep) ? '' : path.sep);
    if (!a.startsWith(b)) {
      previous = value;
      simplifiedPaths.push(value);
    }
  }
  return simplifiedPaths;
}
