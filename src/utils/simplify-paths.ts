import path from 'path';

function addSep(value: string) {
  return value + (value.endsWith(path.sep) ? '' : path.sep);
}

export function isPathDescendant(parent: string, descendant: string): boolean {
  return addSep(descendant).startsWith(addSep(parent));
}

export interface SimplifiedPaths {
  paths: string[];
  exists(path: string): boolean;
}

/**
 * filter out paths that are already included in another path.
 * e.g. Filter out file paths when the entire directory path is already included.
 * @param paths Paths to simplify.
 * @returns The simplified paths result.
 */
export function simplifyPaths(paths: string[]): SimplifiedPaths {
  paths = Array.from(paths);
  if (paths.length <= 1) {
    return { paths, exists: () => true };
  }
  const exists: { [path: string]: boolean } = {};
  // sort: intentionally mutate array
  const simplifiedPaths = paths.sort().splice(0, 1);
  let previous = simplifiedPaths[0];
  for (const value of paths) {
    exists[value] = !isPathDescendant(previous, path.dirname(value));
    if (exists[value]) {
      previous = value;
      simplifiedPaths.push(value);
    }
  }
  return { paths: simplifiedPaths, exists: path => exists[path] };
}
