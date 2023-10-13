import fs from 'fs';

export async function lstat(path: string): Promise<fs.Stats | undefined> {
  try {
    return await fs.promises.lstat(path);
  } catch (error) {
    // do nothing
  }
}
