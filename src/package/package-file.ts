import fs from 'fs';
import path from 'path';

export async function copyFile(src: string, dest: string): Promise<void> {
  // ensure directory exists
  try {
    const stats = await fs.promises.lstat(src);
    if (stats.isFile()) {
      await fs.promises.mkdir(path.dirname(dest), { recursive: true });
    }
  } catch {
    // do nothing
  }
  // copy recursively, avoid symlinking
  await fs.promises.cp(src, dest, { recursive: true });
}

export async function removeFile(filePath: string): Promise<boolean> {
  try {
    await fs.promises.rm(filePath, { recursive: true });
    return true;
  } catch {
    return false;
  }
}
