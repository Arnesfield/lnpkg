import { Entry, LnPkgOptions } from '../types/core.types';

export interface NormalizedOptions {
  clean: boolean;
  entries: Entry[];
}

export function normalizeOptions(options: LnPkgOptions): NormalizedOptions {
  const { paths, target } = options;
  if (paths.length === 0) {
    throw new Error('No paths specified.');
  }

  const entries: Entry[] = [];
  const add = (entry: Entry) => {
    // check if path map already exists
    const exists = entries.some(
      existing => existing.src === entry.src && existing.dest === entry.dest
    );
    if (!exists) {
      entries.push(entry);
    }
  };

  for (const value of paths) {
    if (typeof value === 'string') {
      // check target
      if (!target || typeof target !== 'string') {
        throw new Error('Missing "target" path option.');
      }
      add({ src: value, dest: target });
    } else if (
      value &&
      typeof value === 'object' &&
      value.src &&
      typeof value.src === 'string' &&
      value.dest &&
      typeof value.dest === 'string'
    ) {
      add(value);
    } else {
      throw new Error(`Not a valid path map: ${value}`);
    }
  }

  const opts: NormalizedOptions = { clean: options.clean || false, entries };
  return opts;
}
