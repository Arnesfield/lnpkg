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
  logger: Logger;
  dryRun?: boolean;
}

export class Runner {
  private readonly logger: Logger;
  private readonly queue: Queue<Action>;
  private readonly dryRun?: boolean;

  constructor(options: RunnerOptions) {
    this.logger = options.logger;
    this.dryRun = options.dryRun;
    this.queue = new Queue<Action>({ handle: item => this.handleAction(item) });
  }

  private async handleAction(item: Action) {
    if (item.type === 'init') {
      await this.reinit(item.link.src);
      return;
    }
    const file = item.link.src.getFile(item.filePath);
    if (file) {
      await this.run(item.link, file, item.type, true);
    }
  }

  enqueue(item: Action): void {
    this.queue.enqueue(item);
  }

  async run(
    link: Link,
    file: PackageFile,
    type: 'copy' | 'remove',
    watchMode = false
  ): Promise<void> {
    const cwd = process.cwd();
    const time = new Time();
    const prefix: PrefixOptions = {
      link,
      time: watchMode,
      dryRun: this.dryRun
    };
    const logs = () => [
      chalk.bold[type === 'copy' ? 'blue' : 'magenta'](type),
      file.filePath,
      chalk.yellow(time.diff('file')),
      '(' + chalk.dim(path.relative(cwd, file.path)),
      chalk.red('→'),
      chalk.dim(path.relative(cwd, link.getDestPath(file.filePath))) + ')'
    ];

    const destFilePath = link.getDestPath(file.filePath);
    time.start('file');
    try {
      let log = true;
      if (this.dryRun) {
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

  protected async reinit(pkg: Package): Promise<void> {
    const file = pkg.getFile('package.json');
    if (!file) {
      return;
    }
    const time = new Time();
    const prefix: PrefixOptions = { pkg, time: true, dryRun: this.dryRun };
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
