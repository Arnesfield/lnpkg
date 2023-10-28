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

  getPrefix(link: PackageLink, watchMode = false): string[] {
    const log =
      (this.options.dryRun ? '%s ' : '') +
      (watchMode ? '[%s] ' : '') +
      '%s %s %s:';
    const logs = [log];
    if (this.options.dryRun) {
      logs.push(chalk.bgBlack.yellow('dry'));
    }
    if (watchMode) {
      logs.push(chalk.gray(formatTime(new Date())));
    }
    logs.push(
      this.getDisplayName(link.src),
      chalk.red('→'),
      this.getDisplayName(link.dest)
    );
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

    const prefix = this.getPrefix(link, watchMode);
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
        console.log(...prefix, ...logs());
      }
    } catch (error) {
      console.error(
        ...prefix,
        chalk.bgRed('error'),
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
    const prefix = [
      '[%s] %s:',
      chalk.gray(formatTime(new Date())),
      this.getDisplayName(pkg)
    ];
    const logs = () => [
      chalk.bold.blue('init'),
      'Reinitialize package',
      chalk.yellow(time.diff('file')),
      '(' + chalk.dim(path.relative(process.cwd(), pkg.path)) + ')'
    ];

    try {
      await pkg.init();
      console.log(...prefix, ...logs());
    } catch (error) {
      console.error(
        ...prefix,
        chalk.bgRed('error'),
        ...logs(),
        error instanceof Error ? error.toString() : error
      );
    }
  }
}
