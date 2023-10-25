import { Package } from '../package/package';
import { Entry } from '../types/core.types';
import { Link } from './link';

export async function createLinks(entries: Entry[]): Promise<Link[]> {
  const map: { [path: string]: Package | undefined } = {};
  const promises = entries.map(async entry => {
    let src = map[entry.src];
    let dest = map[entry.dest];
    // resolve destination first to make sure it's available for the next iterations
    if (!dest) {
      await (map[entry.dest] = dest = new Package()).init(entry.dest);
    }
    if (!src) {
      await (map[entry.src] = src = new Package()).init(entry.src);
      await src.loadFiles();
    }
    return new Link({ src, dest });
  });
  return Promise.all(promises);
}
