import chalk from 'chalk';
import path from 'path';
import { diffFiles } from '../helpers/diff-files';
import { Logger, PrefixOptions } from '../helpers/logger';
import { PackageFile } from '../package/package.types';
import { cp, rm } from '../utils/fs.utils';
import { cwd } from '../utils/path.utils';
import { Timer } from '../utils/timer';
import { Link } from './link';
import { LnPkgOptions } from './lnpkg.types';

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
      const message = ['%s is not a dependency of %s.'];
      const params = [
        this.logger.getDisplayName(link.src),
        this.logger.getDisplayName(link.dest)
      ];
      if (!force) {
        message.push('Use %s option to allow this link.');
        params.push(chalk.bold('--force'));
      }
      message.push('(%s %s %s)');
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

  // previous files
  async refresh(options: {
    link: Link;
    files: PackageFile[];
    copy?: PackageFile[];
    prefix?: PrefixOptions;
  }): Promise<void> {
    const { link, files, copy, prefix } = options;
    const diff = diffFiles(files, link.src.files);
    await this.run('remove', { link, files: diff.removed, prefix });
    await this.run('copy', { link, prefix, files: copy || [] });
    await this.run('copy', {
      link,
      prefix,
      label: '+added',
      files: diff.added
    });
  }

  async run(
    type: 'copy' | 'remove',
    options: {
      link: Link;
      files: PackageFile[];
      label?: string;
      prefix?: PrefixOptions;
    }
  ): Promise<void> {
    const { dryRun, force, skip } = this.options;
    const { link, files } = options;
    if (files.length === 0 || ((!force || skip) && !link.isDependency())) {
      // do nothing if not a dependency
      return;
    }

    let count = 0;
    // handle tty for progress loader
    const { isTTY } = process.stdout;
    // no need to clear timer
    const timer = new Timer();
    const prefix: PrefixOptions = { link, dryRun, ...options.prefix };
    const [color, label] =
      type === 'copy'
        ? (['green', '+copied'] as const)
        : (['red', '-removed'] as const);
    const logs = () => {
      const logs = [
        chalk.bgBlack[color](options.label || label),
        `${count}/${files.length}`
      ];
      // show progress percentage
      if (count !== files.length) {
        const percent = Math.min(100, Math.ceil((count / files.length) * 100));
        logs.push(`(${percent}%)`);
      }
      logs.push(chalk.yellow(timer.diff('file', true)));
      return logs;
    };

    timer.start('file');
    if (isTTY) {
      this.logger.log(prefix, ...logs());
    }
    try {
      const promises = files.map(async (file, index) => {
        const destFilePath = link.getDestPath(file.filePath);
        let success = true;
        if (dryRun) {
          // do nothing
        } else if (type === 'copy') {
          await cp(file.path, destFilePath);
        } else if (!(await rm(destFilePath))) {
          success = false;
        }
        // do not count failed operations
        count += +success;
        // for non tty, log only last result
        if (isTTY) {
          this.logger.clearPreviousLine();
        }
        if (isTTY || index === files.length - 1) {
          this.logger.log(prefix, ...logs());
        }
      });
      await Promise.all(promises);
    } catch (error) {
      prefix.error = true;
      this.logger.error(
        prefix,
        ...logs(),
        error instanceof Error ? error.toString() : error
      );
    }
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
      chalk.bgBlack.cyan('init'),
      'Reinitialize package:',
      chalk.dim(path.relative(this.cwd, pkg.path) || '.'),
      chalk.yellow(timer.diff('init'))
    ];

    timer.start('init');
    try {
      await pkg.init(true);
      this.logger.log(prefix, ...logs());
    } catch (error) {
      prefix.error = true;
      this.logger.error(
        prefix,
        ...logs(),
        error instanceof Error ? error.toString() : error
      );
    }
  }
}
