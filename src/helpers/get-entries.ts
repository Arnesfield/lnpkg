import path from 'path';
import { Entry, LnPkgOptions } from '../types/core.types';
import { cwd } from '../utils/cwd';

export interface GetEntriesOptions
  extends Pick<LnPkgOptions, 'to' | 'cwd' | 'paths'> {}

// resolve paths with cwd
// assume all paths used by Package and Link are resolved with cwd
export function getEntries(options: GetEntriesOptions): Entry[] {
  const dir = cwd(options.cwd);
  const entries: Entry[] = [];
  const paths = Array.isArray(options.to)
    ? options.to
    : typeof options.to === 'string'
    ? [options.to]
    : [];
  // NOTE: duplicates not filtered out
  for (const dest of paths) {
    for (const src of options.paths) {
      const entry: Entry = typeof src === 'object' ? { ...src } : { src, dest };
      entry.src = path.resolve(dir, entry.src);
      entry.dest = path.resolve(dir, entry.dest);
      entries.push(entry);
    }
  }
  return entries;
}
