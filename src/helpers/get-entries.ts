import path from 'path';
import { Entry } from '../types/core.types';

export function getEntries(
  items: string | Entry | (string | Entry)[],
  dest: string
): Entry[] {
  // NOTE: duplicates not filtered out
  const paths = Array.isArray(items) ? items : [items];
  return paths.map(src => {
    const entry: Entry = typeof src === 'object' ? { ...src } : { src, dest };
    entry.src = path.resolve(entry.src);
    entry.dest = path.resolve(entry.dest);
    return entry;
  });
}
