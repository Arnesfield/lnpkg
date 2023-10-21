import { Package } from '../types/package.types';
import { readPackage } from './read-package';
import { validatePackagePath } from './validate-package-path';

export async function resolvePackage(pkgPath: string): Promise<Package> {
  const pkgJsonPath = await validatePackagePath(pkgPath);
  const pkgJson = await readPackage(pkgJsonPath);
  return { path: pkgPath, json: pkgJson, files: null };
}
