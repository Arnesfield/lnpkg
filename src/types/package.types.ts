// NOTE: internal

export interface NameMap {
  [name: string]: string;
}

export interface PackageJson {
  name: string;
  files?: string[];
  main?: string;
  bin?: string | NameMap;

  dependencies?: NameMap;
  devDependencies?: NameMap;
  peerDependencies?: NameMap;
  bundleDependencies?: boolean | string[];
  bundledDependencies?: boolean | string[];
  optionalDependencies?: NameMap;
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
