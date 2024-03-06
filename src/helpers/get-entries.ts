import { glob } from 'glob';
import path from 'path';
import { Entry, ScopedInput } from '../types/common.types';
import { ensureArray } from '../utils/ensure-array';
import { cwd } from '../utils/path.utils';

// resolve paths with cwd
// assume all paths used by Package and Link are resolved with cwd
export async function getEntries(inputs: ScopedInput[]): Promise<Entry[]> {
  const entries: Entry[] = [];
  // NOTE: assume dests maintain reference
  const destsCache = new WeakMap<string[], string[]>();
  for (const input of inputs) {
    const dir = cwd(input.cwd);
    const srcs = await expand(input.src, dir);
    // use cache when available
    input.dest ||= [];
    let dests = destsCache.get(input.dest);
    if (!dests) {
      dests = await expand(input.dest, dir);
      destsCache.set(input.dest, dests);
    }
    for (const dest of dests) {
      for (const src of srcs) {
        entries.push({
          options: input,
          src: path.resolve(dir, src),
          dest: path.resolve(dir, dest)
        });
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
