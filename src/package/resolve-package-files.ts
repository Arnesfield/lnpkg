import { glob } from 'glob';
import {
  PACKAGE_FILES_IGNORE_ALWAYS,
  PACKAGE_FILES_IGNORE_DEFAULT,
  PACKAGE_FILES_INCLUDE
} from '../constants/package.constants';
import { PackageJson } from '../types/package.types';
import { simplifyPaths } from '../utils/simplify-paths';

/**
 * Get the `package.json` files.
 * @see Files in https://docs.npmjs.com/cli/configuring-npm/package-json
 * @param pkgPath The path to the `package.json` file.
 * @param pkg The `package.json` file.
 * @returns The package files.
 */
export async function resolvePackageFiles(
  pkgPath: string,
  pkg: PackageJson
): Promise<string[]> {
  const hasFiles = Array.isArray(pkg.files);
  const files = hasFiles ? (pkg.files as string[]) : ['*'];
  files.push(...PACKAGE_FILES_INCLUDE);
  if (pkg.main) {
    files.push(pkg.main);
  }
  if (!pkg.bin) {
    // do nothing
  } else if (typeof pkg.bin === 'string') {
    files.push(pkg.bin);
  } else if (Array.isArray(pkg.bin)) {
    files.push(...pkg.bin);
  } else if (typeof pkg.bin === 'object') {
    files.push(...Object.values(pkg.bin));
  }

  const pkgFiles = await glob(files, {
    cwd: pkgPath,
    dot: true,
    nocase: true,
    ignore: hasFiles
      ? PACKAGE_FILES_IGNORE_ALWAYS
      : PACKAGE_FILES_IGNORE_DEFAULT
  });
  return simplifyPaths(pkgFiles).roots;
}
