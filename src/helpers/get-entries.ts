import path from 'path';
import { Entry, LnPkgOptions } from '../types/core.types';

export function getEntries(options: LnPkgOptions): Entry[] {
  if (options.paths.length === 0) {
    throw new Error('No paths specified.');
  }
  const dest = options.dest || process.cwd();
  const entries: Entry[] = [];
  const existsMap: { [src: string]: { [dest: string]: boolean } | undefined } =
    {};
  for (const src of options.paths) {
    const entry = typeof src === 'object' ? { ...src } : { src, dest };
    entry.src = path.resolve(entry.src);
    entry.dest = path.resolve(entry.dest);

    const srcMap = (existsMap[entry.src] ||= {});
    if (!srcMap[entry.dest]) {
      srcMap[entry.dest] = true;
      entries.push(entry);
    }
  }
  return entries;
}
