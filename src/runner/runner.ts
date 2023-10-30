import chalk from 'chalk';
import path from 'path';
import { Logger, PrefixOptions } from '../helpers/logger';
import { Link } from '../link/link';
import { Package } from '../package/package';
import { PackageFile } from '../types/package.types';
import { cp, rm } from '../utils/fs.utils';
import { Queue } from '../utils/queue';
import { Time } from '../utils/time';
import { Action } from './runner.types';

export interface RunnerOptions {
  dryRun?: boolean;
  force?: boolean;
}

export class Runner {
  private readonly queue: Queue<Action>;

  constructor(
    private readonly logger: Logger,
    private readonly options: RunnerOptions
  ) {
    this.queue = new Queue<Action>({
      handle: (item, index, total) => this.handleAction(item, { index, total })
    });
  }

  private async handleAction(item: Action, nth?: PrefixOptions['nth']) {
    if (item.type === 'init') {
      await this.reinit(item.link.src, nth);
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

  checkLink(link: Link): boolean {
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
      const cwd = process.cwd();
      message.push('(%s %s %s)');
      params.push(
        chalk.dim(path.relative(cwd, link.src.path) || '.'),
        chalk.red('→'),
        chalk.dim(path.relative(cwd, link.dest.path) || '.')
      );

      this.logger.error(
        {
          link,
          error: !force,
          warn: force,
          dryRun: this.options.dryRun,
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
    const cwd = process.cwd();
    const time = new Time();
    const prefix: PrefixOptions = {
      link,
      nth,
      time: watchMode,
      dryRun: this.options.dryRun
    };
    const logs = () => [
      chalk.bgBlack.bold[type === 'copy' ? 'blue' : 'magenta'](type),
      file.filePath,
      chalk.yellow(time.diff('file')),
      '(' + chalk.dim(path.relative(cwd, file.path)),
      chalk.red('→'),
      chalk.dim(path.relative(cwd, destFilePath)) + ')'
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

  private async reinit(pkg: Package, nth?: PrefixOptions['nth']) {
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
      chalk.bold.blue('init'),
      'Reinitialize package',
      chalk.yellow(time.diff('file')),
      '(' + chalk.dim(path.relative(process.cwd(), pkg.path) || '.') + ')'
    ];

    try {
      await pkg.init();
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
