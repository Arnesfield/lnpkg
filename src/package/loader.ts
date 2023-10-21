import path from 'path';
import { Package } from '../types/package.types';
import { resolvePackage } from './resolve-package';

export function loader(): (pkgPath: string) => Promise<Package> {
  const pkgPromiseMap: { [path: string]: Promise<Package> | undefined } = {};
  return (pkgPath: string) => {
    // NOTE: assume resolved packages are consistent while processing occurs
    pkgPath = path.resolve(pkgPath);
    return (pkgPromiseMap[pkgPath] ||= resolvePackage(pkgPath));
  };
}
