import path from 'path';
import { PACKAGE_JSON } from '../constants/package.constants';
import { lstat } from '../utils/fs.utils';
import { ResolvedPackage } from './package.types';
import { readPackage } from './read-package';
import { resolvePackageFiles } from './resolve-package-files';

export interface ResolvePackageOptions {
  target?: string;
}

export async function resolvePackage(
  pkgPath: string,
  options: ResolvePackageOptions = {}
): Promise<ResolvedPackage> {
  let stats = await lstat(pkgPath);
  if (!stats?.isDirectory()) {
    throw new Error(`${pkgPath}: not a directory`);
  }
  const pkgJsonPath = path.resolve(pkgPath, PACKAGE_JSON);
  stats = await lstat(pkgJsonPath);
  if (!stats?.isFile()) {
    throw new Error(`${pkgJsonPath}: not a file`);
  }
  const targetPath = path.resolve(options.target || process.cwd());
  const targetPkgJsonPath = path.resolve(targetPath, PACKAGE_JSON);
  stats = await lstat(targetPkgJsonPath);
  if (!stats?.isFile()) {
    throw new Error(`${targetPkgJsonPath}: not a file`);
  }

  const pkg = await readPackage(pkgJsonPath);
  const resolved: ResolvedPackage = {
    src: pkgPath,
    dest: path.resolve(targetPath, 'node_modules', pkg.name),
    package: pkg,
    files: []
  };

  const filePaths = await resolvePackageFiles(pkgPath, pkg);
  for (const filePath of filePaths) {
    resolved.files.push({
      src: path.resolve(resolved.src, filePath),
      dest: path.resolve(resolved.dest, filePath)
    });
  }
  return resolved;
}
