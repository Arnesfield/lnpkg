import { PackageJson } from '@npmcli/package-json';
import { minimatch } from 'minimatch';
import packlist from 'npm-packlist';
import path from 'path';
import { absolute } from '../utils/path.utils';
import { isPathDescendant } from '../utils/simplify-paths';
import { PackageFile } from './package.types';
import { readPackage } from './read-package';
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
      const pkgName = this.json.name;
      const name = pkgName && pkgName + ' ';
      throw new Error('Package files not loaded: ' + name + this.path);
    }
    return this._files;
  }

  async init(): Promise<void> {
    // load package
    const pkgJsonPath = await validatePackagePath(this.path);
    const json = await readPackage(pkgJsonPath);
    // make sure name does not change before saving changes
    const previousName = this._json?.name;
    const newName = json.name;
    if (previousName && previousName !== newName) {
      throw new Error(
        `Package name changed from "${previousName}" to "${newName}". ` +
          'Requires a restart to apply directory changes.'
      );
    }
    this._json = json;
    // also load files if they were available when refreshing
    if (this._files) {
      await this.loadFiles(true);
    }
  }

  async loadFiles(refresh = false): Promise<void> {
    if (refresh || !this._files) {
      // no need to update node when refreshing
      const files = await packlist({ path: this.path });
      this.fileLookup = {};
      this._files = files.map(filePath => {
        const file: PackageFile = {
          filePath,
          path: path.resolve(this.path, filePath)
        };
        this.fileLookup[file.path] = file;
        return file;
      });
    }
  }

  async getFile(filePath: string): Promise<PackageFile | undefined> {
    // check if part of src path
    filePath = absolute(filePath, this.path);
    let file = this.fileLookup[filePath];
    if (!file) {
      // if no match, reload package files
      await this.loadFiles(true);
      file = this.fileLookup[filePath];
    }
    return file;
  }

  isPathInPackage(filePath: string): boolean {
    // may not be always accurate but should be good enough for most cases
    filePath = absolute(filePath, this.path);
    if (this.fileLookup[filePath]) {
      return true;
    } else if (!isPathDescendant(this.path, filePath)) {
      return false;
    }
    // make sure file is not part of direct node_modules
    const relPath = path.relative(this.path, filePath);
    if (/^(?:node_modules)(?:$|\/)/.test(relPath)) {
      return false;
    }
    // if no package files to compare,
    // give up and let this file in for processing
    const files = this.json.files || [];
    if (files.length === 0) {
      return true;
    }
    // try to match files. is the last check ok?
    for (const file of files) {
      if (
        relPath === file ||
        minimatch(relPath, file) ||
        minimatch(relPath, file + '/**')
      ) {
        return true;
      }
    }
    return false;
  }
}
