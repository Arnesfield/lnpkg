// NOTE: internal

export interface PackageJson {
  name: string;
  files?: string[];
  main?: string;
  bin?: string | { [name: string]: string };
  [key: string]: unknown;
}

export interface PackageFile {
  /**
   * Absolute path to file.
   */
  path: string;
  /**
   * Path to file relative to the package path.
   */
  filePath: string;
}

export interface Package {
  /**
   * Absolute path to the package directory.
   */
  path: string;
  /**
   * The source `package.json`.
   */
  json: PackageJson;
  /**
   * Resolved `package.json` files.
   */
  files: PackageFile[] | null;
}
