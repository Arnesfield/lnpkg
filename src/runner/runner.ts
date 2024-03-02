import chalk from 'chalk';
import path from 'path';
import { LnPkgOptions } from '../core/lnpkg.types';
import { Logger, PrefixOptions } from '../helpers/logger';
import { Link } from '../link/link';
import { PackageFile } from '../package/package.types';
import { cwd } from '../utils/cwd';
import { cp, rm } from '../utils/fs.utils';
import { Timer } from '../utils/timer';

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

  async link(link: Link): Promise<void> {
    const promises = link.src.files.map(file => {
      return this.run('copy', { link, file });
    });
    await Promise.all(promises);
  }

  async run(
    type: 'copy' | 'remove',
    options: {
      link: Link;
      file: PackageFile;
      watchMode?: boolean;
      nth?: PrefixOptions['nth'];
    }
  ): Promise<void> {
    const { dryRun, force, skip } = this.options;
    const { link, file, nth, watchMode } = options;
    if ((!force || skip) && !link.isDependency()) {
      // do nothing if not a dependency
      return;
    }
    const destFilePath = link.getDestPath(file.filePath);
    const timer = new Timer();
    const prefix: PrefixOptions = { link, nth, time: watchMode };
    const logs = () => [
      chalk.bgBlack.bold[type === 'copy' ? 'blue' : 'magenta'](type),
      file.filePath,
      chalk.yellow(timer.diff('file'))
    ];

    timer.start('file');
    try {
      let log = true;
      if (dryRun) {
        // do nothing
      } else if (type === 'copy') {
        await cp(file.path, destFilePath);
      } else if (!(await rm(destFilePath))) {
        log = false;
      }
      if (log) {
        prefix.dryRun = dryRun;
        this.logger.log(prefix, ...logs());
      }
    } catch (error) {
      prefix.error = true;
      this.logger.error(
        prefix,
        ...logs(),
        error instanceof Error ? error.toString() : error
      );
    }
  }

  async reinit(link: Link, nth?: PrefixOptions['nth']): Promise<void> {
    const pkg = link.src;
    const file = pkg.getFile('package.json');
    if (!file) {
      return;
    }
    const timer = new Timer();
    const prefix: PrefixOptions = {
      pkg,
      nth,
      time: true,
      dryRun: this.options.dryRun
    };
    const logs = () => [
      chalk.bgBlack.bold.green('init'),
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
