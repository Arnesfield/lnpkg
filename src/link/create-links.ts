import path from 'path';
import { Package } from '../package/package';
import { Entry } from '../types/core.types';
import { Link } from './link';

export async function createLinks(entries: Entry[]): Promise<Link[]> {
  const map: { [path: string]: Package | undefined } = {};
  const promises = entries.map(async entry => {
    const srcPath = path.resolve(entry.src);
    const destPath = path.resolve(entry.dest);
    if (!map[srcPath]) {
      await (map[srcPath] = new Package()).init(srcPath);
    }
    if (!map[destPath]) {
      await (map[destPath] = new Package()).init(destPath);
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return new Link({ src: map[srcPath]!, dest: map[destPath]! });
  });
  return Promise.all(promises);
}
