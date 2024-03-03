import { PackageFile } from '../package/package.types';

export interface DiffFilesResult {
  retained: PackageFile[];
  added: PackageFile[];
  removed: PackageFile[];
}

export function diffFiles(a: PackageFile[], b: PackageFile[]): DiffFilesResult {
  const retained: PackageFile[] = [];
  const added: PackageFile[] = [];
  const files: { [path: string]: PackageFile } = {};
  const checked: { [path: string]: boolean } = {};
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