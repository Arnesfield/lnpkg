/**
 * Common input options.
 *
 * Note that these options can only be overriden by the CLI options if
 * they are not set in {@linkcode LnPkgOptions.input} (scoped options).
 */
export interface ScopedOptions {
  /**
   * Resolve all package paths to this path instead of the current working directory.
   * @default process.cwd()
   */
  cwd?: string;
  /**
   * Allow link even if source package is not a dependency of destination package.
   */
  force?: boolean;
  /**
   * Skip link if source package is not a dependency of destination package.
   */
  skip?: boolean;
  /**
   * Unlink source packages from destination packages
   * (package files only) and skip linking them in watch mode.
   */
  unlink?: boolean;
}

/**
 * Input options.
 */
export interface Input extends ScopedOptions {
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
export interface LnPkgOptions extends ScopedOptions {
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
   *
   * Defaults to the current working directory if not provided.
   */
  dest?: string | string[];
  /**
   * Log only without performing operations (noop).
   *
   * @overridable By the CLI options or the previous loaded config file.
   */
  dryRun?: boolean;
  /**
   * Watch package files for changes after linking packages.
   *
   * @overridable By the CLI options or the previous loaded config file.
   */
  watch?: boolean;
  /**
   * Skip linking packages and watch package files for changes only.
   *
   * @overridable By the CLI options or the previous loaded config file.
   */
  watchOnly?: boolean;
  /**
   * Output logs only of equal or higher level.
   * @default 'info'
   */
  logLevel?: 'info' | 'warn' | 'error';
}
