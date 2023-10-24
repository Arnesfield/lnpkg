import path from 'path';
import { Package } from '../package/package';
import { cp } from '../utils/fs.utils';

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

  getDestPath(): string {
    return path.resolve(this.dest.path, 'node_modules', this.src.json.name);
  }

  async copy(filePath: string): Promise<boolean> {
    const file = this.src.getFile(filePath);
    if (!file) {
      return false;
    }
    const destFilePath = path.resolve(this.getDestPath(), file.filePath);
    await cp(file.path, destFilePath);
    return true;
  }
}
