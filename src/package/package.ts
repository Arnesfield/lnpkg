import Arborist, { Node } from '@npmcli/arborist';
import { PackageJson } from '@npmcli/package-json';
import packlist from 'npm-packlist';
import path from 'path';
import { PackageFile } from './package.types';
import { readPackage } from './read-package';
import { validatePackagePath } from './validate-package-path';

export class Package {
  private node: Node | undefined;
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
    const json = this.node ? this.node.package : this._json;
    if (!json) {
      throw new Error(`Package not initialized: ${this.path}`);
    }
    return json;
  }

  /**
   * Resolved `package.json` files.
   */
  get files(): PackageFile[] {
    if (!this._files) {
      const pkgName = this.node?.package.name || '';
      const name = pkgName && pkgName + ' ';
      throw new Error('Package files not loaded: ' + name + this.path);
    }
    return this._files;
  }

  private async loadNode() {
    // need to create new Arborist instance every init
    const arborist = new Arborist({ path: this.path });
    return (this.node = await arborist.loadActual());
  }

  /**
   * Initialize package.
   * @param loadNode Load {@linkcode Node} for source package.
   */
  async init(loadNode: boolean): Promise<void> {
    const pkgJsonPath = await validatePackagePath(this.path);
    // load not required unless it's a src package
    if (loadNode) {
      await this.loadNode();
    } else {
      this._json = await readPackage(pkgJsonPath);
    }
    // also load files if they were available when refreshing
    if (this._files) {
      await this.loadFiles(true);
    }
  }

  async loadFiles(refresh = false): Promise<void> {
    if (refresh || !this._files) {
      // no need to update node when refreshing
      const node = this.node || (await this.loadNode());
      const files = await packlist(node);
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
    filePath = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(this.path, filePath);
    let file = this.fileLookup[filePath];
    if (!file) {
      // if no match, reload package files. seems fast enough ¯\_(ツ)_/¯
      await this.loadFiles(true);
      file = this.fileLookup[filePath];
    }
    return file;
  }
}
