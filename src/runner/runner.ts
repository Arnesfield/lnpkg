import chalk from 'chalk';
import path from 'path';
import { Link, PackageLink } from '../link/link';
import { Package } from '../package/package';
import { PackageFile } from '../types/package.types';
import { colors } from '../utils/colors';
import { formatTime } from '../utils/format-time';
import { Time } from '../utils/time';
import { Action } from './runner.types';

export class Runner {
  private readonly color = colors();
  private readonly actions: Action[] = [];

  async enqueue(item: Action): Promise<void> {
    const isRunning = this.actions.length > 0;
    this.actions.push(item);
    if (isRunning) {
      return;
    }
    for (const item of this.actions) {
      switch (item.action) {
        case 'init':
          await this.reinit(item.link.src);
          break;
        case 'copy': {
          const file = item.link.src.getFile(item.filePath);
          if (file) {
            await this.run(item.link, file, true);
          }
          break;
        }
      }
    }
    this.actions.length = 0;
  }

  getDisplayName(pkg: Package): string {
    return chalk[this.color(pkg)].bold(pkg.json.name);
  }

  getPrefix(link: PackageLink): string[] {
    const srcName = this.getDisplayName(link.src);
    const destName = this.getDisplayName(link.dest);
    return ['%s %s %s:', srcName, chalk.red('→'), destName];
  }

  async runAll(links: Link[]): Promise<void> {
    const cwd = process.cwd();
    const time = new Time();
    for (const link of links) {
      const prefix = this.getPrefix(link);
      console.log(
        ...prefix,
        chalk.bold.blue('load'),
        chalk.dim(path.relative(cwd, link.src.path)),
        chalk.red('→'),
        chalk.dim(path.relative(cwd, link.getDestPath()))
      );

      time.start('files');
      const promises = link.src.files.map(file => this.run(link, file));
      await Promise.all(promises);

      console.log(
        ...prefix,
        chalk.bold.green('done'),
        chalk.yellow(time.diff('files'))
      );
    }
  }

  protected async run(
    link: Link,
    file: PackageFile,
    watchMode = false
  ): Promise<void> {
    const time = new Time();
    const logs = () => {
      const logs = [
        chalk.bold.blue('copy'),
        file.filePath,
        chalk.yellow(time.diff('file'))
      ];
      if (watchMode) {
        const cwd = process.cwd();
        logs.push(
          '(' + chalk.dim(path.relative(cwd, file.path)),
          chalk.red('→'),
          chalk.dim(path.relative(cwd, link.getDestPath(file.filePath))) + ')'
        );
      }
      return logs;
    };

    const prefix = this.getPrefix(link);
    if (watchMode) {
      prefix[0] = '[%s] ' + prefix[0];
      prefix.splice(1, 0, chalk.gray(formatTime(new Date())));
    }
    time.start('file');
    try {
      // TODO: handle/remove clean?
      if (await link.copy(file.path)) {
        console.log(...prefix, ...logs());
      } else {
        time.clear('file');
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
      await pkg.init(pkg.path);
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
