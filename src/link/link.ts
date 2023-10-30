import path from 'path';
import { Package } from '../package/package';

export class Link {
  constructor(readonly src: Package, readonly dest: Package) {}

  getDestPath(...paths: string[]): string {
    return path.resolve(
      this.dest.path,
      'node_modules',
      this.src.json.name,
      ...paths
    );
  }
}
