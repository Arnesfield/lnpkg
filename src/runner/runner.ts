import chalk from 'chalk';
import path from 'path';
import { Logger, PrefixOptions } from '../helpers/logger';
import { Link } from '../link/link';
import { LnPkgOptions } from '../types/core.types';
import { PackageFile } from '../types/package.types';
import { cwd } from '../utils/cwd';
import { cp, rm } from '../utils/fs.utils';
import { Queue } from '../utils/queue';
import { Time } from '../utils/time';
import { Action } from './runner.types';

export interface RunnerOptions extends Exclude<LnPkgOptions, 'dest'> {}

export class Runner {
  private readonly cwd: string;
  private readonly queue: Queue<Action>;

  constructor(
    private readonly logger: Logger,
    private readonly options: RunnerOptions
  ) {
    this.cwd = cwd(options.cwd);
    this.queue = new Queue<Action>({
      handle: (item, index, total) => this.handleAction(item, { index, total })
    });
  }

  private async handleAction(item: Action, nth?: PrefixOptions['nth']) {
    if (item.type === 'init') {
      await this.reinit(item.link, nth);
      return;
    }
    const file = item.link.src.getFile(item.filePath);
    if (!file) {
      return;
    }
    await this.run(item.type, { nth, file, link: item.link, watchMode: true });
  }

  enqueue(item: Action): void {
    this.queue.enqueue(item);
  }

  checkLink(
    link: Link,
    options?: Pick<PrefixOptions, 'nth' | 'time'>
  ): boolean {
    const { force } = this.options;
    const isDependency = link.isDependency();
    if (!isDependency) {
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
      params.push(
        chalk.dim(path.relative(this.cwd, link.src.path) || '.'),
        chalk.red('→'),
        chalk.dim(path.relative(this.cwd, link.getDestPath()))
      );

      this.logger.error(
        {
          ...options,
          link,
          error: !force,
          warn: force,
          message: message.join(' ')
        },
        ...params
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

  private async run(
    type: 'copy' | 'remove',
    options: {
      link: Link;
      file: PackageFile;
      watchMode?: boolean;
      nth?: PrefixOptions['nth'];
    }
  ) {
    const { link, file, nth, watchMode } = options;
    if (!this.options.force && !link.isDependency()) {
      // do nothing if not a dependency
      return;
    }
    const destFilePath = link.getDestPath(file.filePath);
    const time = new Time();
    const prefix: PrefixOptions = { link, nth, time: watchMode };
    const logs = () => [
      chalk.bgBlack.bold[type === 'copy' ? 'blue' : 'magenta'](type),
      file.filePath,
      chalk.yellow(time.diff('file')),
      '(' + chalk.dim(path.relative(this.cwd, file.path)),
      chalk.red('→'),
      chalk.dim(path.relative(this.cwd, destFilePath)) + ')'
    ];

    time.start('file');
    try {
      let log = true;
      if (this.options.dryRun) {
        // do nothing
      } else if (type === 'copy') {
        await cp(file.path, destFilePath);
      } else if (!(await rm(destFilePath))) {
        log = false;
      }
      if (log) {
        prefix.dryRun = this.options.dryRun;
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

  private async reinit(link: Link, nth?: PrefixOptions['nth']) {
    const pkg = link.src;
    const file = pkg.getFile('package.json');
    if (!file) {
      return;
    }
    const time = new Time();
    const prefix: PrefixOptions = {
      pkg,
      nth,
      time: true,
      dryRun: this.options.dryRun
    };
    const logs = () => [
      chalk.bgBlack.bold.green('init'),
      'Reinitialize package.',
      chalk.yellow(time.diff('init')),
      '(' + chalk.dim(path.relative(this.cwd, pkg.path) || '.') + ')'
    ];

    time.start('init');
    try {
      await pkg.init();
      this.logger.log(prefix, ...logs());
      this.checkLink(link, { nth, time: true });
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
