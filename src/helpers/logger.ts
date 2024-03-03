import chalk from 'chalk';
import path from 'path';
import stripAnsi from 'strip-ansi';
import util from 'util';
import { name } from '../../package.json';
import { Link } from '../core/link';
import { Package } from '../package/package';
import { colors } from '../utils/colors';
import { formatTime } from '../utils/format-time';

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
  nth?: { index: number; total: number };
}

export class Logger {
  private readonly color = colors();
  /** The last log line. */
  private line: string | undefined;

  getDisplayName(pkg: Package): string {
    return chalk[this.color(pkg)].bold(pkg.json.name);
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
    const { nth, link, pkg, message } = options;
    const prefix: string[] = [];
    if (options.app) {
      prefix.push(chalk.bgBlack(name));
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
    if (options.time) {
      prefix.push('[' + chalk.gray(formatTime(new Date())) + ']');
    }
    if (nth) {
      prefix.push('[' + chalk.gray(nth.index + 1 + '/' + nth.total) + ']');
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

  format(options: PrefixOptions, ...params: unknown[]): string {
    return util.format(this.prefix(options), ...params);
  }

  log(options: PrefixOptions, ...params: unknown[]): void {
    this.line = this.format(options, ...params);
    console.log(this.line);
  }

  error(options: PrefixOptions, ...params: unknown[]): void {
    this.line = this.format(options, ...params);
    console.error(this.line);
  }

  clearPreviousLine(): void {
    if (typeof this.line !== 'string') {
      return;
    }
    const log = stripAnsi(this.line);
    const lines = Math.ceil(log.length / process.stdout.columns);
    // cursor up and start of lines
    // clear from cursor to end of screen
    process.stdout.write(`\x1b[${lines}F` + '\x1b[0J');
  }
}
