import path from 'path';
import { Entry } from '../types/core.types';
import { Package } from './package';

export interface PackageEntry {
  src: Package;
  dest: Package;
}

export async function loadEntries(entries: Entry[]): Promise<PackageEntry[]> {
  const pkgMap: { [pkgPath: string]: Package | undefined } = {};
  const promises = entries.map(async entry => {
    const srcPath = path.resolve(entry.src);
    const destPath = path.resolve(entry.dest);
    if (!pkgMap[srcPath]) {
      await (pkgMap[srcPath] = new Package()).init(srcPath);
    }
    if (!pkgMap[destPath]) {
      await (pkgMap[destPath] = new Package()).init(destPath);
    }
    return { src: pkgMap[srcPath], dest: pkgMap[destPath] } as PackageEntry;
  });
  return Promise.all(promises);
}
