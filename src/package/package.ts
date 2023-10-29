import path from 'path';
import { PackageFile, PackageJson } from '../types/package.types';
import { isPathDescendant, simplifyPaths } from '../utils/simplify-paths';
import { readPackage } from './read-package';
import { resolvePackageFiles } from './resolve-package-files';
import { validatePackagePath } from './validate-package-path';

export class Package {
  private _json: PackageJson | undefined;
  private _files: PackageFile[] | undefined;
  private fileLookup: { [path: string]: PackageFile | undefined } = {};

  constructor(
    /**
     * Absolute path to the package directory.
     */
    readonly path: string
  ) {}

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

  async init(): Promise<PackageJson> {
    const pkgJsonPath = await validatePackagePath(this.path);
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
      this.fileLookup = {};
      this._files = filePaths.map(filePath => {
        const file: PackageFile = {
          filePath,
          path: path.resolve(this.path, filePath)
        };
        this.fileLookup[file.path] = file;
        return file;
      });
    }
    return this._files;
  }

  getFile(filePath: string): PackageFile | undefined {
    // check if part of src path
    filePath = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(this.path, filePath);
    const matchedFile =
      this.fileLookup[filePath] ||
      this.files.find(file => file.path === filePath);
    if (!matchedFile) {
      // if no matched files, check if filePath is in package files
      const isInPackage =
        isPathDescendant(this.path, filePath) &&
        simplifyPaths(this.files.map(file => file.path).concat(filePath)).map[
          filePath
        ];
      if (!isInPackage) {
        return;
      }
    }
    // add to fileLookup when valid
    const file = (this.fileLookup[filePath] = matchedFile || {
      path: filePath,
      filePath: path.relative(this.path, filePath)
    });
    return file;
  }
}
