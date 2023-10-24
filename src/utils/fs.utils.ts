import fs from 'fs';
import path from 'path';

export async function lstat(value: string): Promise<fs.Stats> {
  try {
    return await fs.promises.lstat(value);
  } catch (error) {
    const isNotFound =
      error instanceof Error &&
      (error as NodeJS.ErrnoException).code === 'ENOENT';
    throw isNotFound ? new Error(`No such file or directory: ${value}`) : error;
  }
}

export async function cp(src: string, dest: string): Promise<void> {
  // ensure directory exists
  const stats = await lstat(src);
  if (stats.isFile()) {
    await fs.promises.mkdir(path.dirname(dest), { recursive: true });
  }
  // copy recursively, avoid symlinking
  await fs.promises.cp(src, dest, { recursive: true });
}

// TODO: clean?
export async function rm(value: string): Promise<boolean> {
  try {
    await fs.promises.rm(value, { recursive: true });
    return true;
  } catch {
    return false;
  }
}
