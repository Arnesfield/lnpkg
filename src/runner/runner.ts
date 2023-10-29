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
    const cwd = process.cwd();
    const time = new Time();
    const prefix: PrefixOptions = {
      link,
      nth,
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

  private async reinit(pkg: Package, nth?: PrefixOptions['nth']) {
    const file = pkg.getFile('package.json');
    if (!file) {
      return;
    }
    const time = new Time();
    const prefix: PrefixOptions = { pkg, nth, time: true, dryRun: this.dryRun };
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
