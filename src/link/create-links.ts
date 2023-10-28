import { Package } from '../package/package';
import { Entry } from '../types/core.types';
import { Link } from './link';

export async function createLinks(
  entries: Entry[]
): Promise<{ links: Link[]; total: number }> {
  const map: { [path: string]: Package | undefined } = {};
  const links: Link[] = [];
  const sources = new Set<Package>();
  // initialize all packages
  for (const entry of entries) {
    const exists = { src: map[entry.src], dest: map[entry.dest] };
    const pkg = {
      src: (map[entry.src] ||= new Package(entry.src)),
      dest: (map[entry.dest] ||= new Package(entry.dest))
    };
    if (!exists.src) {
      await pkg.src.init();
    }
    if (!exists.dest) {
      await pkg.dest.init();
    }
    sources.add(pkg.src);
    links.push(new Link(pkg));
  }
  // load all files from source packages after init
  if (sources.size > 0) {
    await Promise.all(Array.from(sources).map(src => src.loadFiles()));
  }
  return { links, total: Object.keys(map).length };
}
