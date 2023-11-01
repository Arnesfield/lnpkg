import path from 'path';
import { Entry } from '../types/core.types';
import { cwd } from '../utils/cwd';

export interface GetEntriesOptions {
  cwd: string | undefined;
  dest: string | undefined;
  items: string | Entry | (string | Entry)[];
}

// resolve paths with cwd
// assume all paths used by Package and Link are resolved with cwd
export function getEntries(options: GetEntriesOptions): Entry[] {
  const { items } = options;
  const dir = cwd(options.cwd);
  const dest = options.dest ? path.resolve(dir, options.dest) : dir;
  // NOTE: duplicates not filtered out
  const paths = Array.isArray(items) ? items : [items];
  return paths.map(src => {
    const entry: Entry = typeof src === 'object' ? { ...src } : { src, dest };
    entry.src = path.resolve(dir, entry.src);
    entry.dest = path.resolve(dir, entry.dest);
    return entry;
  });
}
