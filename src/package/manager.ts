import path from 'path';
import { Package } from '../types/package.types';
import { resolvePackage } from './resolve-package';

export class Manager {
  private readonly pkgMap: {
    [path: string]: Package | undefined;
  } = {};
  private readonly pkgPromiseMap: {
    [path: string]: Promise<Package> | undefined;
  } = {};

  async use(pkgPath: string): Promise<Package> {
    // NOTE: assume resolved packages are consistent while processing occurs
    pkgPath = path.resolve(pkgPath);
    let pkg = this.pkgMap[pkgPath];
    if (!pkg) {
      const promise = (this.pkgPromiseMap[pkgPath] ||= resolvePackage(pkgPath));
      pkg = this.pkgMap[pkgPath] = await promise;
    }
    return pkg;
  }
}
