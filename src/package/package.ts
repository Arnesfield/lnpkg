import type Arborist from '@npmcli/arborist';
import { PackageJson } from '@npmcli/package-json';
import { minimatch } from 'minimatch';
import path from 'path';
import { npmPackFiles } from '../helpers/npm-pack-files';
import { absolute } from '../utils/path.utils';
import { isPathDescendant } from '../utils/simplify-paths';
import { try2do } from '../utils/try2do';
import { loadNode } from './load-node';
import { PackageFile } from './package.types';
import { readPackage } from './read-package';
import { validatePackagePath } from './validate-package-path';

export class Package {
  private _node: Arborist.Node | undefined;
  private _json: PackageJson | undefined;
  private _files: PackageFile[] | undefined;
  private _displayName: string | undefined;
  private fileLookup: { [path: string]: PackageFile | undefined } = {};

  constructor(
    /**
     * Absolute path to the package directory.
     */
    readonly path: string
  ) {}

  get name(): string | undefined {
    return this._node?.package.name ?? this._json?.name;
  }

  get displayName(): string | undefined {
    return this._displayName ?? this.name;
  }

  set displayName(value: string | undefined) {
    this._displayName = value;
  }

  private get node() {
    if (!this._node) {
      throw new Error(`Package not initialized: ${this.path}`);
    }
    return this._node;
  }

  get json(): PackageJson {
    const json = this._node?.package ?? this._json;
    if (!json) {
      throw new Error(`Package not initialized: ${this.path}`);
    }
    return json;
  }

  get files(): PackageFile[] {
    if (!this._files) {
      const pkgName = this.name;
      const name = pkgName && pkgName + ' ';
      throw new Error('Package files not loaded: ' + name + this.path);
    }
    return this._files;
  }

  private async _init() {
    const Arborist = await try2do(() => import('@npmcli/arborist'));
    const previousName = this.name;
    const values: { node?: Arborist.Node; json?: PackageJson } = {};
    let newName: string | undefined;
    // use either arborist instance or load manually
    if (Arborist) {
      values.node = await loadNode(this.path, Arborist.default);
      newName = values.node.package.name;
    } else {
      const pkgJsonPath = await validatePackagePath(this.path);
      values.json = await readPackage(pkgJsonPath);
      newName = values.json.name;
    }

    if (!newName) {
      throw new Error(`Package name is required: ${this.path}/package.json`);
    }
    // make sure name does not change before saving changes
    if (typeof previousName === 'string' && previousName !== newName) {
      throw new Error(
        `Package name changed from "${previousName}" to "${newName}". ` +
          'Requires a restart to apply directory changes.'
      );
    }

    this._node = values.node;
    this._json = values.json;
  }

  private async _packlist() {
    // no need to update node when refreshing
    const packlist = this._node
      ? await try2do(() => import('npm-packlist'))
      : undefined;
    return packlist
      ? packlist.default(this.node)
      : npmPackFiles({ cwd: this.path });
  }

  async init(): Promise<void> {
    // NOTE: assume that there is no way for `init` and `loadFiles`
    // to be called multiple times at the same time for the same package
    await this._init();
    // also load files if they were available when refreshing
    if (this._files) {
      await this.loadFiles(true);
    }
  }

  async loadFiles(refresh = false): Promise<void> {
    if (refresh || !this._files) {
      const files = await this._packlist();
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

  indexOf(filePath: string): number {
    filePath = absolute(filePath, this.path);
    const file = this.fileLookup[filePath];
    // assume that file reference is kept
    return file && this._files ? this._files.indexOf(file) : -1;
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

  removeFile(filePath: string): void {
    filePath = absolute(filePath, this.path);
    const index = this.indexOf(filePath);
    if (index > -1) {
      // retain reference to current files
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this._files!.splice(index, 1);
    }
    delete this.fileLookup[filePath];
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
    const { files } = this.node.package;
    if (!files || files.length === 0) {
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
