import path from 'path';
import { PACKAGE_JSON } from '../constants/package.constants';
import { PathMap } from '../core/core.types';
import { lstat } from '../utils/fs.utils';

export async function validatePathMap(
  pathMap: PathMap
): Promise<{ srcPkgJsonPath: string; destPkgJsonPath: string }> {
  let stats = await lstat(pathMap.src);
  if (!stats?.isDirectory()) {
    throw new Error(`${pathMap.src}: not a directory`);
  }
  const srcPkgJsonPath = path.resolve(pathMap.src, PACKAGE_JSON);
  stats = await lstat(srcPkgJsonPath);
  if (!stats?.isFile()) {
    throw new Error(`${srcPkgJsonPath}: not a file`);
  }
  const destPkgJsonPath = path.resolve(pathMap.dest, PACKAGE_JSON);
  stats = await lstat(destPkgJsonPath);
  if (!stats?.isFile()) {
    throw new Error(`${destPkgJsonPath}: not a file`);
  }
  return { srcPkgJsonPath, destPkgJsonPath };
}
