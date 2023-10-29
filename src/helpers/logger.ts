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
  dryRun?: boolean;
  message?: string;
}

export class Logger {
  private readonly color = colors();

  private getDisplayName(pkg: Package) {
    return chalk[this.color(pkg)].bold(pkg.json.name);
  }

  prefix(options: PrefixOptions): string {
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
    if (options.time) {
      prefix.push('[' + chalk.gray(formatTime(new Date())) + ']');
    }

    const pkgLog: string[] = [];
    if (options.link) {
      pkgLog.push(
        this.getDisplayName(options.link.src),
        this.getDisplayName(options.link.dest)
      );
    } else if (options.pkg) {
      pkgLog.push(this.getDisplayName(options.pkg));
    }
    if (pkgLog.length > 0) {
      prefix.push(pkgLog.join(' ' + chalk.red('→') + ' ') + ':');
    }
    if (options.message) {
      prefix.push(options.message);
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
