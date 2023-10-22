import fs from 'fs';
import path from 'path';
import { PACKAGE_JSON } from '../constants/package.constants';

/**
 * Validate the package path and get the path to its `package.json`.
 * @param pkgPath The package path.
 * @returns The path to `package.json` of package path.
 */
export async function validatePackagePath(pkgPath: string): Promise<string> {
  let stats = await lstat(pkgPath);
  if (!stats.isDirectory()) {
    throw new Error(`Not a directory: ${pkgPath}`);
  }
  const pkgJsonPath = path.resolve(pkgPath, PACKAGE_JSON);
  stats = await lstat(pkgJsonPath);
  if (!stats.isFile()) {
    throw new Error(`Not a file: ${pkgJsonPath}`);
  }
  return pkgJsonPath;
}

async function lstat(value: string) {
  try {
    return await fs.promises.lstat(value);
  } catch (error) {
    const isNotFound =
      error instanceof Error &&
      (error as NodeJS.ErrnoException).code === 'ENOENT';
    throw isNotFound ? new Error(`No such file or directory: ${value}`) : error;
  }
}
