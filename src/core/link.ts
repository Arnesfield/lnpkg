import path from 'path';
import { hasDependency } from '../package/has-dependency';
import { Package } from '../package/package';
import { ScopedOptions } from './lnpkg.types';

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

  // TODO: linking src -> dest === src files
  // TODO: unlinking src -> dest === src files from dest
}
