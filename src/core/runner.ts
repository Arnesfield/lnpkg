import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { diffFiles } from '../helpers/diff-files';
import { Logger, PrefixOptions } from '../helpers/logger';
import { PackageFile } from '../package/package.types';
import { errorLog, isNoEntryError } from '../utils/error';
import { cp, rm } from '../utils/fs.utils';
import { cwd } from '../utils/path.utils';
import { Timer } from '../utils/timer';
import { Link } from './link';
import { LnPkgOptions, ScopedOptions } from './lnpkg.types';

export type RunType = 'copy' | 'remove';

export interface RunnerCommonOptions {
  options: ScopedOptions;
  prefix?: PrefixOptions;
}

export class Runner {
  constructor(
    private readonly logger: Logger,
    private readonly options: Pick<LnPkgOptions, 'dryRun'>
  ) {}

  checkLink(link: Link, prefix?: PrefixOptions): boolean {
    const { force, skip } = link.options;
    const pathLink = this.logger.getPathLink({
      cwd: cwd(link.options.cwd),
      source: link.src.path,
      target: link.getDestPath()
    });
    const isDependency = link.isDependency();
    if (isDependency) {
      const message = ['%s %s %s'];
      if (prefix?.message) {
        message.push(prefix.message);
      }
      this.logger.log(
        { ...prefix, link, message: message.join(' ') },
        ...pathLink
      );
    } else if (!skip) {
      const message = ['%s is not a dependency of %s%s'];
      const params = [
        this.logger.getDisplayName(link.src),
        this.logger.getDisplayName(link.dest),
        force ? ':' : '.'
      ];
      if (!force) {
        message.push('Use %s option to allow this link:');
        params.push(chalk.bold('--force'));
      }
      message.push('%s %s %s');
      if (prefix?.message) {
        message.push(prefix.message);
      }

      this.logger.error(
        {
          ...prefix,
          link,
          error: !force,
          warn: force,
          message: message.join(' ')
        },
        ...params,
        ...pathLink
      );
    }
    return force || isDependency;
  }

  async refresh(options: {
    link: Link;
    files: PackageFile[]; // previous files
    prefix?: PrefixOptions;
  }): Promise<void> {
    const diff = diffFiles(options.files, await options.link.src.files());
    await this.run('remove', { ...options, files: diff.removed });
    await this.run('copy', { ...options, files: diff.added });
  }

  async run(
    type: RunType,
    options: { link: Link; files: PackageFile[]; prefix?: PrefixOptions }
  ): Promise<void> {
    const { link, files } = options;
    const { force, skip } = link.options;
    if ((!force || skip) && !link.isDependency()) {
      // do nothing if not a dependency
      return;
    }

    // handle tty for progress loader
    const { isTTY } = process.stdout;
    const { dryRun } = this.options;
    const count = { done: 0, enoent: 0, error: 0 };
    // no need to clear timer
    const prefix: PrefixOptions = { link, dryRun, ...options.prefix };
    const [color, label] =
      type === 'copy'
        ? (['green', '+copy'] as const)
        : (['red', '-remove'] as const);
    const displayType = chalk.bgBlack[color](label);
    const timer = new Timer();
    const logs = () => {
      return ([] as (string | number)[]).concat(
        displayType,
        `${count.done}/${files.length}`,
        count.enoent > 0
          ? [chalk.bgBlack.yellow('-enoent'), count.enoent + '']
          : [],
        count.error > 0 ? [chalk.bgBlack.red('-error'), count.error + ''] : [],
        chalk.yellow(timer.diff('file', true))
      );
    };

    timer.start('file');
    if (isTTY || files.length === 0) {
      this.logger.log(prefix, ...logs());
    }
    const promises = files.map(async file => {
      const destFilePath = link.getDestPath(file.filePath);
      try {
        if (!dryRun) {
          // check if path exists first
          await fs.promises.lstat(file.path);
          if (type === 'copy') {
            await cp(file.path, destFilePath);
          } else {
            await rm(destFilePath);
          }
        }
        count.done++;
      } catch (error) {
        // if file to un/link is not found, ignore error
        if (isNoEntryError(error)) {
          count.enoent++;
        } else {
          count.error++;
          if (isTTY) {
            this.logger.clearPreviousLine();
          }
          this.logger.error(
            { ...prefix, error: true },
            displayType,
            file.filePath,
            chalk.yellow(timer.diff('file', true)),
            errorLog(error)
          );
          // log again to avoid clearing error line
          if (isTTY) {
            this.logger.log(prefix, ...logs());
          }
        }
      }
      // for non tty, log only last result
      if (isTTY) {
        this.logger.clearPreviousLine();
      }
      const total = count.done + count.enoent + count.error;
      if (isTTY || total === files.length) {
        this.logger.log(prefix, ...logs());
      }
    });
    await Promise.all(promises);
  }

  async reinit(options: { link: Link; prefix?: PrefixOptions }): Promise<void> {
    const pkg = options.link.src;
    const prefix: PrefixOptions = { ...options.prefix, pkg };
    const timer = new Timer();
    const dir = cwd(options.link.options.cwd);
    const logs = () => [
      chalk.bgBlack.cyan('~init'),
      'Reinitialize package:',
      chalk.dim(path.relative(dir, pkg.path) || '.'),
      chalk.yellow(timer.diff('init'))
    ];

    timer.start('init');
    try {
      await pkg.init();
      this.logger.log(prefix, ...logs());
    } catch (error) {
      prefix.error = true;
      this.logger.error(prefix, ...logs(), errorLog(error));
    }
  }
}
