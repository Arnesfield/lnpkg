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
  const sep = ':';
  const entries: Entry[] = [];
  for (let index = 0; index < paths.length; index++) {
    const src = paths[index];
    if (typeof src === 'object') {
      add(entries, src);
      continue;
    } else if (src === sep || src.startsWith('-')) {
      continue;
    }
    const next = paths[index + 1];
    const dest = paths[index + 2];
    if (next === sep && dest && typeof dest === 'string') {
      add(entries, { src, dest });
      index += 2;
    } else if (!target || typeof target !== 'string') {
      // check target
      throw new Error('Missing "target" path option.');
    } else {
      add(entries, { src, dest: target });
    }
  }
  return entries;
}
