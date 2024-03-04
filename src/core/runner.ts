import chalk from 'chalk';
import path from 'path';
import { diffFiles } from '../helpers/diff-files';
import { Logger, PrefixOptions } from '../helpers/logger';
import { PackageFile } from '../package/package.types';
import { errorLog } from '../utils/error';
import { cp, rm } from '../utils/fs.utils';
import { cwd } from '../utils/path.utils';
import { Timer } from '../utils/timer';
import { Link } from './link';
import { LnPkgOptions } from './lnpkg.types';

export type RunType = 'copy' | 'remove';

export interface RunnerOptions
  extends Pick<LnPkgOptions, 'cwd' | 'dryRun' | 'force' | 'skip'> {}

export class Runner {
  private readonly cwd: string;

  constructor(
    private readonly logger: Logger,
    private readonly options: RunnerOptions
  ) {
    this.cwd = cwd(options.cwd);
  }

  checkLink(
    link: Link,
    options?: Pick<PrefixOptions, 'nth' | 'time' | 'message'>
  ): boolean {
    const { force, skip } = this.options;
    const pathLink = this.logger.getPathLink({
      cwd: this.cwd,
      source: link.src.path,
      target: link.getDestPath()
    });
    const isDependency = link.isDependency();
    if (isDependency) {
      const message = ['%s %s %s'];
      if (options?.message) {
        message.push(options.message);
      }
      this.logger.log(
        { ...options, link, message: message.join(' ') },
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
      if (options?.message) {
        message.push(options.message);
      }

      this.logger.error(
        {
          ...options,
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
    const { link, files, prefix } = options;
    const diff = diffFiles(files, link.src.files);
    await this.run('remove', { link, prefix, files: diff.removed });
    await this.run('copy', { link, prefix, files: diff.added });
  }

  async run(
    type: RunType,
    options: { link: Link; files: PackageFile[]; prefix?: PrefixOptions }
  ): Promise<void> {
    const { dryRun, force, skip } = this.options;
    const { link, files } = options;
    if (files.length === 0 || ((!force || skip) && !link.isDependency())) {
      // do nothing if not a dependency
      return;
    }

    const count = { done: 0, error: 0 };
    // handle tty for progress loader
    const { isTTY } = process.stdout;
    // no need to clear timer
    const timer = new Timer();
    const prefix: PrefixOptions = { link, dryRun, ...options.prefix };
    const [color, label] =
      type === 'copy'
        ? (['green', '+copied'] as const)
        : (['red', '-removed'] as const);
    const displayType = chalk.bgBlack[color](label);
    const logs = () => {
      return ([] as (string | number)[]).concat(
        displayType,
        `${count.done}/${files.length}`,
        count.error > 0 ? [chalk.bgBlack.red('-error'), count.error] : [],
        chalk.yellow(timer.diff('file', true))
      );
    };

    timer.start('file');
    if (isTTY) {
      this.logger.log(prefix, ...logs());
    }
    const promises = files.map(async file => {
      const destFilePath = link.getDestPath(file.filePath);
      try {
        if (dryRun) {
          // do nothing
        } else if (type === 'copy') {
          await cp(file.path, destFilePath);
          // unlike removeFile, adding file probably doesn't do anything
          // since files are refreshed almost always before run
        } else if (type === 'remove') {
          await rm(destFilePath);
          link.src.removeFile(file.filePath);
        }
        count.done++;
      } catch (error) {
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
      // for non tty, log only last result
      if (isTTY) {
        this.logger.clearPreviousLine();
      }
      if (isTTY || count.done + count.error === files.length) {
        this.logger.log(prefix, ...logs());
      }
    });
    await Promise.all(promises);
  }

  async reinit(options: { link: Link; prefix?: PrefixOptions }): Promise<void> {
    const pkg = options.link.src;
    const timer = new Timer();
    const prefix: PrefixOptions = {
      pkg,
      dryRun: this.options.dryRun,
      ...options.prefix
    };
    const logs = () => [
      chalk.bgBlack.cyan('~init'),
      'Reinitialize package:',
      chalk.dim(path.relative(this.cwd, pkg.path) || '.'),
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
