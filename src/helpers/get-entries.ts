import path from 'path';
import { Entry, LnPkgOptions } from '../types/core.types';
import { cwd } from '../utils/cwd';

export interface GetEntriesOptions
  extends Pick<LnPkgOptions, 'cwd' | 'dest' | 'paths'> {}

// resolve paths with cwd
// assume all paths used by Package and Link are resolved with cwd
export function getEntries(options: GetEntriesOptions): Entry[] {
  const dir = cwd(options.cwd);
  const dest = options.dest ? path.resolve(dir, options.dest) : dir;
  // NOTE: duplicates not filtered out
  return options.paths.map(src => {
    const entry: Entry = typeof src === 'object' ? { ...src } : { src, dest };
    entry.src = path.resolve(dir, entry.src);
    entry.dest = path.resolve(dir, entry.dest);
    return entry;
  });
}
