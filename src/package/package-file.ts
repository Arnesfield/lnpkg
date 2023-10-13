import fs from 'fs';
import path from 'path';
import { PackageFile } from './package.types';

export async function copyFile(file: PackageFile): Promise<void> {
  // ensure directory exists
  try {
    const stats = await fs.promises.lstat(file.src);
    if (stats.isFile()) {
      await fs.promises.mkdir(path.dirname(file.dest), { recursive: true });
    }
  } catch {
    // do nothing
  }

  // copy recursively, avoid symlinking
  await fs.promises.cp(file.src, file.dest, { recursive: true });
}

export async function removeFile(file: PackageFile): Promise<boolean> {
  try {
    await fs.promises.rm(file.dest, { recursive: true });
    return true;
  } catch {
    return false;
  }
}
