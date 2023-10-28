import path from 'path';
import { Entry, LnPkgOptions } from '../types/core.types';

function add(entries: Entry[], entry: Entry) {
  entry.src = path.resolve(entry.src);
  entry.dest = path.resolve(entry.dest);
  // check if path map already exists
  const exists = entries.some(
    existing => existing.src === entry.src && existing.dest === entry.dest
  );
  if (!exists) {
    entries.push(entry);
  }
}

export function getEntries(options: LnPkgOptions): Entry[] {
  const { paths, target } = options;
  if (paths.length === 0) {
    throw new Error('No paths specified.');
  }
  const entries: Entry[] = [];
  for (const src of paths) {
    if (typeof src === 'object') {
      add(entries, src);
    } else if (!target || typeof target !== 'string') {
      // check target
      throw new Error('Missing "target" path option.');
    } else {
      add(entries, { src, dest: target });
    }
  }
  return entries;
}
