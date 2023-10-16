import path from 'path';
import { PathMap } from '../core/core.types';
import { ResolvedPackage } from './package.types';
import { readPackage } from './read-package';
import { resolvePackageFiles } from './resolve-package-files';
import { validatePathMap } from './validate-path-map';

export async function resolvePackage(
  pathMap: PathMap
): Promise<ResolvedPackage> {
  const { srcPkgJsonPath } = await validatePathMap(pathMap);
  const pkg = await readPackage(srcPkgJsonPath);
  const dest = path.resolve(pathMap.dest, 'node_modules', pkg.name);
  if (pathMap.src === dest) {
    throw new Error(`${pkg.name}: cannot link to the same directory`);
  }
  const resolved: ResolvedPackage = {
    src: pathMap.src,
    dest,
    package: pkg,
    files: []
  };
  const filePaths = await resolvePackageFiles(resolved.src, pkg);
  for (const filePath of filePaths) {
    resolved.files.push({
      src: path.resolve(resolved.src, filePath),
      dest: path.resolve(resolved.dest, filePath)
    });
  }
  return resolved;
}
