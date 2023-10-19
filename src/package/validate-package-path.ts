import fs from 'fs';
import path from 'path';
import { PACKAGE_JSON } from '../constants/package.constants';

/**
 * Validate the package path and get the path to its `package.json`.
 * @param pkgPath The package path.
 * @returns The path to `package.json` of package path.
 */
export async function validatePackagePath(pkgPath: string): Promise<string> {
  let stats = await fs.promises.lstat(pkgPath);
  if (!stats.isDirectory()) {
    throw new Error(`${pkgPath}: not a directory`);
  }
  const pkgJsonPath = path.resolve(pkgPath, PACKAGE_JSON);
  stats = await fs.promises.lstat(pkgJsonPath);
  if (!stats.isFile()) {
    throw new Error(`${pkgJsonPath}: not a file`);
  }
  return pkgJsonPath;
}
