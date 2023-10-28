import chalk from 'chalk';
import path from 'path';
import { Link, PackageLink } from '../link/link';
import { Package } from '../package/package';
import { PackageFile } from '../types/package.types';
import { colors } from '../utils/colors';
import { formatTime } from '../utils/format-time';
import { cp, rm } from '../utils/fs.utils';
import { Queue } from '../utils/queue';
import { Time } from '../utils/time';
import { Action } from './runner.types';

export interface RunnerOptions {
  dryRun?: boolean;
}

export class Runner {
  private readonly color = colors();
  private readonly queue: Queue<Action>;

  constructor(protected readonly options: RunnerOptions = {}) {
    this.queue = new Queue<Action>({
      handle: item => this.handleAction(item)
    });
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

  getDisplayName(pkg: Package): string {
    return chalk[this.color(pkg)].bold(pkg.json.name);
  }

  getPrefix(
    link: Partial<PackageLink>,
    options: { time?: boolean; error?: boolean } = {}
  ): string[] {
    const log =
      (this.options.dryRun ? '%s ' : '') +
      (options.error ? '%s ' : '') +
      (options.time ? '[%s] ' : '') +
      (link.src && link.dest ? '%s %s %s' : link.src || link.dest ? '%s' : '');
    const logs = [log];
    if (this.options.dryRun) {
      logs.push(chalk.bgBlack.yellow('dry'));
    }
    if (options.error) {
      logs.push(chalk.bgBlack.red('ERR!'));
    }
    if (options.time) {
      logs.push(chalk.gray(formatTime(new Date())));
    }
    const pkg = link.src || link.dest;
    if (link.src && link.dest) {
      logs.push(
        this.getDisplayName(link.src),
        chalk.red('→'),
        this.getDisplayName(link.dest)
      );
    } else if (pkg) {
      logs.push(this.getDisplayName(pkg));
    }
    return logs;
  }

  async run(
    link: Link,
    file: PackageFile,
    type: 'copy' | 'remove',
    watchMode = false
  ): Promise<void> {
    const cwd = process.cwd();
    const time = new Time();
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
      if (this.options.dryRun) {
        // do nothing
      } else if (type === 'copy') {
        await cp(file.path, destFilePath);
      } else if (!(await rm(destFilePath))) {
        log = false;
      }
      if (log) {
        console.log(...this.getPrefix(link, { time: watchMode }), ...logs());
      }
    } catch (error) {
      console.error(
        ...this.getPrefix(link, { time: watchMode, error: true }),
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
    const logs = () => [
      chalk.bold.blue('init'),
      'Reinitialize package',
      chalk.yellow(time.diff('file')),
      '(' + chalk.dim(path.relative(process.cwd(), pkg.path)) + ')'
    ];

    try {
      await pkg.init();
      console.log(...this.getPrefix({ src: pkg }, { time: true }), ...logs());
    } catch (error) {
      console.error(
        ...this.getPrefix({ src: pkg }, { time: true, error: true }),
        ...logs(),
        error instanceof Error ? error.toString() : error
      );
    }
  }
}
