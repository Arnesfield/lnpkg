import chalk from 'chalk';
import path from 'path';
import stripAnsi from 'strip-ansi';
import util from 'util';
import { Link } from '../core/link.js';
import { LnPkgOptions } from '../core/lnpkg.types.js';
import * as PKG from '../package-json.js';
import { Package } from '../package/package.js';
import { colors } from '../utils/colors.js';
import { formatTime } from '../utils/format-time.js';

export interface GetPathLinkOptions {
  cwd: string;
  source: string;
  target: string;
  wrap?: boolean;
}

export interface PrefixOptions {
  pkg?: Package;
  link?: Link;
  app?: boolean;
  time?: boolean;
  error?: boolean;
  warn?: boolean;
  dryRun?: boolean;
  message?: string;
}

// prettier-ignore
export const LOG_LEVEL = { __proto__: null, info: 1, warn: 2, error: 3 } as const;

export class Logger {
  private readonly color = colors();
  private readonly level: number;
  readonly stats = { errors: 0, warnings: 0 };
  /** The last log line. */
  private line: string | undefined;

  constructor(options: Pick<LnPkgOptions, 'logLevel'>) {
    // default to info
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.level = LOG_LEVEL[options.logLevel!] ?? 1;
  }

  getDisplayName(pkg: Package): string {
    return chalk[this.color(pkg)].bold(pkg.displayName);
  }

  getPathLink(options: GetPathLinkOptions): string[] {
    const { cwd, source, target, wrap } = options;
    return [
      (wrap ? '(' : '') + chalk.dim(path.relative(cwd, source) || '.'),
      chalk.red('→'),
      chalk.dim(path.relative(cwd, target)) + (wrap ? ')' : '')
    ];
  }

  prefix(options: PrefixOptions): string {
    const { link, pkg, message } = options;
    const prefix: string[] = [];
    if (options.time) {
      prefix.push('[' + chalk.gray(formatTime(new Date())) + ']');
    }
    if (options.app) {
      prefix.push(chalk.bgBlack(PKG.name));
    }
    if (options.dryRun) {
      prefix.push(chalk.bgBlack.gray('nop'));
    }
    if (options.error) {
      prefix.push(chalk.bgBlack.red('ERR!'));
    }
    if (options.warn) {
      prefix.push(chalk.bgBlack.yellow('WARN'));
    }

    const pkgLog: string[] = [];
    if (link) {
      pkgLog.push(
        this.getDisplayName(link.src),
        this.getDisplayName(link.dest)
      );
    } else if (pkg) {
      pkgLog.push(this.getDisplayName(pkg));
    }
    if (pkgLog.length > 0) {
      prefix.push(pkgLog.join(' ' + chalk.red('→') + ' ') + ':');
    }
    if (message) {
      prefix.push(message);
    }
    return prefix.join(' ');
  }

  private checkLevel(level: number) {
    return this.level <= level;
  }

  private print(
    type: 'log' | 'error',
    options: PrefixOptions,
    params: unknown[]
  ): void {
    if (type !== 'log') {
      this.stats[options.warn ? 'warnings' : 'errors']++;
    }
    const prefix = this.prefix(options);
    this.line = util.format(prefix, ...params);
    console[type](prefix, ...params);
  }

  log(options: PrefixOptions, ...params: unknown[]): void {
    if (this.checkLevel(LOG_LEVEL.info)) {
      this.print('log', options, params);
    }
  }

  error(options: PrefixOptions, ...params: unknown[]): void {
    if (this.checkLevel(options.warn ? LOG_LEVEL.warn : LOG_LEVEL.error)) {
      this.print('error', options, params);
    }
  }

  clearPreviousLine(): void {
    if (typeof this.line !== 'string' || !this.checkLevel(LOG_LEVEL.info)) {
      return;
    }
    const log = stripAnsi(this.line);
    const lines = Math.ceil(log.length / process.stdout.columns);
    // cursor up and start of lines
    // clear from cursor to end of screen
    process.stdout.write(`\x1b[${lines}F` + '\x1b[0J');
  }
}
