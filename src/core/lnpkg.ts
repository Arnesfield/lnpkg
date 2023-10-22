import chalk from 'chalk';
import path from 'path';
import { loadEntries } from '../package/load-entries';
import { copyFile, removeFile } from '../package/package-file';
import { LnPkgOptions } from '../types/core.types';
import { colors } from '../utils/colors';
import { Time } from '../utils/time';
import { normalizeOptions } from './options';

export async function lnpkg(options: LnPkgOptions): Promise<void> {
  const time = new Time();
  time.start('main');
  time.start('entries');

  const opts = normalizeOptions(options);
  const entries = await loadEntries(opts.entries);
  console.log(
    'loaded %o %s:',
    entries.length,
    entries.length === 1 ? 'entry' : 'entries',
    chalk.yellow(time.diff('entries'))
  );

  const cwd = process.cwd();
  const arrow = chalk.red('→');
  const color = colors();
  for (const { src, dest } of entries) {
    // destination is {dest}/node_modules/{src}
    const destPath = path.resolve(dest.path, 'node_modules', src.json.name);
    const output = {
      src: {
        name: chalk[color(src)].bold(src.json.name),
        path: path.relative(cwd, src.path)
      },
      dest: {
        name: chalk[color(dest)].bold(dest.json.name),
        path: path.relative(cwd, destPath)
      }
    };
    const pkgLog = ['%s %s %s:', output.src.name, arrow, output.dest.name];

    const loadLog = () => [
      chalk.bold.blue('load'),
      chalk.dim(output.src.path),
      arrow,
      chalk.dim(output.dest.path),
      chalk.yellow(time.diff('load'))
    ];
    time.start('load');
    try {
      await src.loadFiles();
      console.log(...pkgLog, ...loadLog());
    } catch (error) {
      console.error(
        ...pkgLog,
        chalk.bgRed('error'),
        ...loadLog(),
        error instanceof Error ? error.toString() : error
      );
    }

    time.start('files');
    const promises = src.files.map(async file => {
      const { filePath } = file;
      const destFilePath = path.resolve(destPath, filePath);
      const actionLog = () => [
        chalk.bold.blue(options.clean ? 'clean' : 'copy'),
        filePath,
        chalk.yellow(time.diff(filePath))
      ];
      time.start(filePath);
      try {
        await (options.clean
          ? removeFile(destFilePath)
          : copyFile(file.path, destFilePath));
        console.log(...pkgLog, ...actionLog());
      } catch (error) {
        console.error(
          ...pkgLog,
          chalk.bgRed('error'),
          ...actionLog(),
          error instanceof Error ? error.toString() : error
        );
      }
    });

    await Promise.all(promises);
    console.log(
      ...pkgLog,
      chalk.bold.green('done'),
      chalk.yellow(time.diff('files'))
    );
  }

  console.log('done:', chalk.yellow(time.diff('main')));
}
