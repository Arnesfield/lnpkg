import path from 'path';
import { Package, PackageFile } from '../types/package.types';
import { resolvePackageFiles } from './resolve-package-files';

export async function getPackageFiles(
  pkg: Package,
  force = false
): Promise<PackageFile[]> {
  // load package files if not loaded yet
  if (!force && pkg.files) {
    return pkg.files;
  }
  const filePaths = await resolvePackageFiles(pkg.path, pkg.json);
  return filePaths.map((filePath): PackageFile => {
    return { filePath, path: path.resolve(pkg.path, filePath) };
  });
}
