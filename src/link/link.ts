import path from 'path';
import { Package } from '../package/package';

export interface PackageLink {
  src: Package;
  dest: Package;
}

export class Link {
  readonly src: Package;
  readonly dest: Package;

  constructor(options: PackageLink) {
    this.src = options.src;
    this.dest = options.dest;
  }

  getDestPath(...paths: string[]): string {
    return path.resolve(
      this.dest.path,
      'node_modules',
      this.src.json.name,
      ...paths
    );
  }
}
