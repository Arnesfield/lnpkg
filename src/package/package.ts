import path from 'path';
import { PackageFile, PackageJson } from '../types/package.types';
import { resolvePackageFiles } from './resolve-package-files';

export class Package {
  /**
   * Absolute path to the package directory.
   */
  readonly path: string;
  /**
   * The source `package.json`.
   */
  readonly package: PackageJson;
  /**
   * Resolved `package.json` files.
   */
  readonly files: PackageFile[] = [];

  private didLoadFiles = false;

  constructor(path: string, pkg: PackageJson) {
    this.path = path;
    this.package = pkg;
  }

  async loadFiles(): Promise<void> {
    if (this.didLoadFiles) return;
    this.didLoadFiles = true;
    const filePaths = await resolvePackageFiles(this.path, this.package);
    const files = filePaths.map((filePath): PackageFile => {
      return { filePath, path: path.resolve(this.path, filePath) };
    });
    this.files.length = 0;
    this.files.push(...files);
  }
}
