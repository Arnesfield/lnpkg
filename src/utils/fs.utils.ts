import fs from 'fs';
import path from 'path';
import { isNoEntryError } from './error';

export async function lstat(value: string): Promise<fs.Stats> {
  try {
    return await fs.promises.lstat(value);
  } catch (error) {
    throw isNoEntryError(error)
      ? new Error(`No such file or directory: ${value}`)
      : error;
  }
}

export async function readFile(value: string): Promise<Buffer> {
  const stats = await lstat(value);
  if (!stats.isFile()) {
    throw new Error(`Not a file: ${value}`);
  }
  return fs.promises.readFile(value);
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

export async function rm(value: string): Promise<boolean> {
  try {
    await fs.promises.rm(value, { recursive: true });
    return true;
  } catch (error) {
    if (!isNoEntryError(error)) {
      throw error;
    }
    return false;
  }
}
