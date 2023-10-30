import chalk from 'chalk';
import { name } from '../../package.json';
import { Link } from '../link/link';
import { Package } from '../package/package';
import { colors } from '../utils/colors';
import { formatTime } from '../utils/format-time';

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

  getDisplayName(pkg: Package): string {
    return chalk[this.color(pkg)].bold(pkg.json.name);
  }

  prefix(options: PrefixOptions): string {
    const { nth, link, pkg, message } = options;
    const prefix: string[] = [];
    if (options.app) {
      prefix.push(chalk.bgBlack(name));
    }
    if (options.dryRun) {
      prefix.push(chalk.bgBlack.yellow('dry'));
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

  log(options: PrefixOptions, ...params: unknown[]): void {
    console.log(this.prefix(options), ...params);
  }

  error(options: PrefixOptions, ...params: unknown[]): void {
    console.error(this.prefix(options), ...params);
  }
}
