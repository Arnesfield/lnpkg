import { Package } from '../package/package';
import { PackageFile } from '../package/package.types';

export async function findPackageOwner(
  filePath: string,
  packages: Package[]
): Promise<{ package: Package; file: PackageFile } | undefined> {
  // try to get without refreshing first
  // TODO: maybe a better search can be used
  // and only try to refresh if it really doesn't exist (all file paths -> package)
  for (const refresh of [false, true]) {
    for (const pkg of packages) {
      const file = await pkg.getFile(filePath, refresh);
      if (file) {
        return { package: pkg, file };
      }
    }
  }
}
