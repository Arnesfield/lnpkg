import Arborist from '@npmcli/arborist';
import { PackageJson } from '@npmcli/package-json';
import { minimatch } from 'minimatch';
import packlist from 'npm-packlist';
import path from 'path';
import { absolute } from '../utils/path.utils';
import { isPathDescendant } from '../utils/simplify-paths';
import { loadNode } from './load-node';
import { PackageFile } from './package.types';

export class Package {
  private _node: Arborist.Node | undefined;
  private _files: PackageFile[] | undefined;
  private _displayName: string | undefined;
  private fileLookup: { [path: string]: PackageFile | undefined } =
    Object.create(null);

  constructor(
    /**
     * Absolute path to the package directory.
     */
    readonly path: string
  ) {}

  get displayName(): string | undefined {
    return this._displayName ?? this._node?.package.name;
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
    return this.node.package;
  }

  get files(): PackageFile[] {
    if (!this._files) {
      const pkgName = this._node?.package.name || '';
      const name = pkgName && pkgName + ' ';
      throw new Error('Package files not loaded: ' + name + this.path);
    }
    return this._files;
  }

  private async loadNode() {
    const node = await loadNode(this.path);
    const newName = node.package.name;
    if (!newName) {
      throw new Error(`Package name is required: ${this.path}/package.json`);
    }
    // make sure name does not change before saving changes
    const previousName = this._node?.package.name;
    if (this._node && previousName !== newName) {
      throw new Error(
        `Package name changed from "${previousName}" to "${newName}". ` +
          'Requires a restart to apply directory changes.'
      );
    }
    return node;
  }

  async init(): Promise<void> {
    // NOTE: assume that there is no way for `init` and `loadFiles`
    // to be called multiple times at the same time for the same package
    this._node = await this.loadNode();
    // also load files if they were available when refreshing
    if (this._files) {
      await this.loadFiles(true);
    }
  }

  async loadFiles(refresh = false): Promise<void> {
    if (refresh || !this._files) {
      // no need to update node when refreshing
      const files = await packlist(this.node);
      this.fileLookup = Object.create(null);
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
