import { Package } from './package';
import { readPackage } from './read-package';
import { validatePackagePath } from './validate-package-path';

export async function resolvePackage(pkgPath: string): Promise<Package> {
  const pkgJsonPath = await validatePackagePath(pkgPath);
  const pkgJson = await readPackage(pkgJsonPath);
  return new Package(pkgPath, pkgJson);
}
