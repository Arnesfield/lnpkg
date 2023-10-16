// NOTE: internal

export interface PackageJson {
  name: string;
  files?: string[];
  main?: string;
  bin?: string | { [name: string]: string };
  [key: string]: unknown;
}

export interface PackageFile {
  src: string;
  dest: string;
}

export interface ResolvedPackage {
  /**
   * Package source directory.
   */
  src: string;
  /**
   * Package destination directory.
   */
  dest: string;
  /**
   * The source `package.json`.
   */
  package: PackageJson;
  /**
   * Resolved `package.json` files.
   */
  files: PackageFile[];
}
