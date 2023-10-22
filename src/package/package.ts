import path from 'path';
import { PackageFile, PackageJson } from '../types/package.types';
import { readPackage } from './read-package';
import { resolvePackageFiles } from './resolve-package-files';
import { validatePackagePath } from './validate-package-path';

export class Package {
  private _path: string | undefined;
  private _json: PackageJson | undefined;
  private _files: PackageFile[] | undefined;

  /**
   * Absolute path to the package directory.
   */
  get path(): string {
    if (!this._path) {
      throw new Error('Package not initialized.');
    }
    return this._path;
  }

  /**
   * The source `package.json`.
   */
  get json(): PackageJson {
    if (!this._json) {
      throw new Error(`Package not initialized: ${this.path}`);
    }
    return this._json;
  }

  /**
   * Resolved `package.json` files.
   */
  get files(): PackageFile[] {
    if (!this._files) {
      const name = this._json ? this._json.name + ' ' : '';
      throw new Error('Package files not loaded: ' + name + this.path);
    }
    return this._files;
  }

  async init(pkgPath: string): Promise<PackageJson> {
    this._path = pkgPath;
    const pkgJsonPath = await validatePackagePath(pkgPath);
    this._json = await readPackage(pkgJsonPath);
    // also load files if they were available when refreshing
    if (this._files) {
      await this.loadFiles(true);
    }
    return this._json;
  }

  async loadFiles(refresh = false): Promise<PackageFile[]> {
    if (refresh || !this._files) {
      const filePaths = await resolvePackageFiles(this.path, this.json);
      this._files = filePaths.map((filePath): PackageFile => {
        return { filePath, path: path.resolve(this.path, filePath) };
      });
    }
    return this._files;
  }
}
