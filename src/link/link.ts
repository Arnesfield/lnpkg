import { Package } from '../package/package';
import { Entry } from '../types/core.types';

export interface Link {
  src: Package;
  dest: Package;
}

export async function createLinks(
  entries: Entry[]
): Promise<{ links: Link[]; total: number }> {
  const map: { [path: string]: Package | undefined } = {};
  const links: Link[] = [];
  const sources = new Set<Package>();
  // initialize all packages
  for (const entry of entries) {
    const exists = { src: map[entry.src], dest: map[entry.dest] };
    const link: Link = {
      src: (map[entry.src] ||= new Package(entry.src)),
      dest: (map[entry.dest] ||= new Package(entry.dest))
    };
    if (!exists.src) {
      await link.src.init();
    }
    if (!exists.dest) {
      await link.dest.init();
    }
    sources.add(link.src);
    links.push(link);
  }
  // load all files from source packages after init
  if (sources.size > 0) {
    await Promise.all(Array.from(sources).map(src => src.loadFiles()));
  }
  return { links, total: Object.keys(map).length };
}
