import { Package } from '../package/package';
import { PackageFile } from '../package/package.types';

export async function findPackageOwner(
  filePath: string,
  packages: Package[]
): Promise<{ package: Package; file: PackageFile } | undefined> {
  for (const pkg of packages) {
    const file = await pkg.getFile(filePath);
    if (file) {
      return { package: pkg, file };
    }
  }
}
