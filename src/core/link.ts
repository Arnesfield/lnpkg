import path from 'path';
import { hasDependency } from '../package/has-dependency.js';
import { Package } from '../package/package.js';
import { PackageFile } from '../package/package.types.js';
import { ScopedOptions } from './lnpkg.types.js';

export class Link {
  constructor(
    readonly options: ScopedOptions,
    readonly src: Package,
    readonly dest: Package
  ) {}

  getDestPath(...paths: string[]): string {
    return path.resolve(
      this.dest.path,
      'node_modules',
      this.src.json.name || '',
      ...paths
    );
  }

  isDependency(): boolean {
    // check if src is a dependency of dest.
    // keep dependency check in Link instead of Package
    // since only dest packages actually need this check
    const { name } = this.src.json;
    return typeof name === 'string' && hasDependency(this.dest.json, name);
  }

  async getSrcFilesFromDest(): Promise<PackageFile[]> {
    // it's fine if package does not load properly (e.g. not exists yet)
    const pkg = new Package(this.getDestPath());
    try {
      await pkg.init();
      return await pkg.files();
    } catch {
      return [];
    }
  }
}
