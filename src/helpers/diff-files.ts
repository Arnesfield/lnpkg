import { PackageFile } from '../package/package.types.js';

export interface DiffFilesResult {
  retained: PackageFile[];
  added: PackageFile[];
  removed: PackageFile[];
}

export function diffFiles(a: PackageFile[], b: PackageFile[]): DiffFilesResult {
  const retained: PackageFile[] = [];
  const added: PackageFile[] = [];
  const files: { [path: string]: PackageFile } = Object.create(null);
  const checked: { [path: string]: boolean } = Object.create(null);
  for (const file of a) {
    files[file.path] = file;
  }
  for (const file of b) {
    // prevent duplicates
    if (checked[file.path]) {
      continue;
    }
    checked[file.path] = true;
    const array = files[file.path] ? retained : added;
    array.push(file);
    // delete since this file is saved
    delete files[file.path];
  }
  // treat remaining files as removed
  return { retained, added, removed: Object.values(files) };
}
