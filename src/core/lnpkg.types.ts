/**
 * Input options.
 */
export interface Input {
  /**
   * Source package path(s) or glob pattern(s).
   */
  src: string | string[];
  /**
   * Destination package path(s) or glob pattern(s).
   *
   * Defaults to {@linkcode LnPkgOptions.dest} if not provided.
   */
  dest?: string | string[];
}

/**
 * Link package options.
 */
export interface LnPkgOptions {
  /**
   * Source package(s) or {@linkcode Input Input(s)} to link to destination package(s).
   *
   * Can be paths or glob patterns.
   */
  input: string | Input | (string | Input)[];
  /**
   * Default destination package(s) to link source package(s) to.
   *
   * Can be paths or glob patterns.
   */
  dest?: string | string[];
  /**
   * Resolve all package paths to this path instead of the current working directory.
   * @default process.cwd()
   */
  cwd?: string;
  /**
   * Log only without performing operations (noop).
   */
  dryRun?: boolean;
  /**
   * Allow link even if source package is not a dependency of destination package.
   */
  force?: boolean;
  /**
   * Skip link if source package is not a dependency of destination package.
   */
  skip?: boolean;
  /**
   * Watch package files for changes after linking packages.
   */
  watch?: boolean;
  /**
   * Skip linking packages and watch package files for changes only.
   */
  watchOnly?: boolean;
}

/**
 * The LnPkg stats.
 */
export interface LnPkgStats {
  /**
   * Total number of links (source package -> destination package).
   */
  links: number;
  /**
   * Total number of packages.
   */
  packages: number;
  /**
   * Total number of errors.
   */
  errors: number;
  /**
   * Total number of warnings.
   */
  warnings: number;
}

/**
 * The LnPkg object.
 */
export interface LnPkg {
  /**
   * Get the LnPkg stats.
   * @returns The LnPkg stats.
   */
  stats(): LnPkgStats;
  /**
   * Close the watcher if it exists.
   */
  close(): Promise<void>;
  /**
   * Check if the watcher exists and is watching for package file changes.
   * @returns `true` if the watcher exists.
   */
  isWatching(): boolean;
}
