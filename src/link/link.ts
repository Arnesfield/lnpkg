import path from 'path';
import { hasDependency } from '../package/has-dependency';
import { Package } from '../package/package';

export class Link {
  constructor(readonly src: Package, readonly dest: Package) {}

  getDestPath(...paths: string[]): string {
    return path.resolve(
      this.dest.path,
      'node_modules',
      this.src.json.name || '',
      ...paths
    );
  }

  // check if src a dependency of dest
  isDependency(): boolean {
    return hasDependency(this.dest.json, this.src.json.name || '');
  }
}
