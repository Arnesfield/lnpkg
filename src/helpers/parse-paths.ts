import { Entry } from '../types/core.types';

export function parsePaths(paths: string[]): (string | Entry)[] {
  // get `<src> : <dest>` entries
  const sep = ':';
  const entries: (string | Entry)[] = [];
  for (let index = 0; index < paths.length; index++) {
    const src = paths[index];
    if (src === sep) {
      continue;
    }
    entries.push(
      index < paths.length - 2 && paths[index + 1] === sep
        ? { src, dest: paths[(index += 2)] }
        : src
    );
  }
  return entries;
}
