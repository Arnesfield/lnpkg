import path from 'path';

function addSep(value: string) {
  return value + (value.endsWith(path.sep) ? '' : path.sep);
}

export function isPathDescendant(
  ancestor: string,
  descendant: string
): boolean {
  return addSep(descendant).startsWith(addSep(ancestor));
}

export interface SimplifiedPaths {
  roots: string[];
  descendants: string[];
  /** Path -> parent path if any. */
  map: { [path: string]: string | null };
}

/**
 * filter out paths that are already included in another path.
 * e.g. Filter out file paths when the entire directory path is already included.
 * @param paths Paths to simplify.
 * @returns The simplified paths result.
 */
export function simplifyPaths(paths: string[]): SimplifiedPaths {
  const map: SimplifiedPaths['map'] = {};
  const sorted = paths.slice().sort();
  let previous = sorted[0];
  for (const value of sorted) {
    const ancestor = addSep(previous);
    const parent = addSep(path.dirname(value));
    const descendant = addSep(value);
    if (ancestor === descendant) {
      map[value] = null;
      continue;
    }
    const isDescendant = parent.startsWith(ancestor);
    map[value] = isDescendant ? previous : null;
    previous = isDescendant ? previous : value;
  }

  // add to sets after
  const roots = new Set<string>();
  const descendants = new Set<string>();
  for (const value of paths) {
    (map[value] ? descendants : roots).add(value);
  }
  return {
    map,
    roots: Array.from(roots),
    descendants: Array.from(descendants)
  };
}
