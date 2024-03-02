import { glob } from 'glob';
import path from 'path';
import { LnPkgOptions } from '../core/lnpkg.types';
import { Entry } from '../core/manager';
import { cwd } from '../utils/cwd';
import { ensureArray } from '../utils/ensure-array';

export interface GetEntriesOptions
  extends Pick<LnPkgOptions, 'cwd' | 'dest' | 'input'> {}

// resolve paths with cwd
// assume all paths used by Package and Link are resolved with cwd
export async function getEntries(options: GetEntriesOptions): Promise<Entry[]> {
  const entries: Entry[] = [];
  const dir = cwd(options.cwd);
  const inputs = ensureArray(options.input);
  const dests = await expand(options.dest, dir);
  // NOTE: duplicates not filtered out
  for (const defaultDest of dests) {
    const defaultDests = await expand(defaultDest, dir);
    for (const input of inputs) {
      const isObject = typeof input === 'object';
      const srcs = await expand(isObject ? input.src : input, dir);
      // fallback to default dests if no dest provided
      const dests =
        isObject && input.dest != null
          ? await expand(input.dest, dir)
          : defaultDests;
      for (const dest of dests) {
        for (const src of srcs) {
          entries.push({
            src: path.resolve(dir, src),
            dest: path.resolve(dir, dest)
          });
        }
      }
    }
  }
  return entries;
}

async function expand(value: string | string[] | undefined, cwd: string) {
  const values = ensureArray(value);
  const paths = await glob(values, { cwd, dot: true, nocase: true });
  // if no paths, fallback to just using values
  const result = paths.length === 0 ? values.slice() : paths;
  return result.sort();
}
