import chalk from 'chalk';
import path from 'path';
import { getPackageFiles } from '../package/get-package-files';
import { loader } from '../package/loader';
import { copyFile, removeFile } from '../package/package-file';
import { LnPkgOptions } from '../types/core.types';
import { colors } from '../utils/colors';
import { Time } from '../utils/time';
import { normalizeOptions } from './options';

export async function lnpkg(options: LnPkgOptions): Promise<void> {
  const opts = normalizeOptions(options);
  const cwd = process.cwd();
  const load = loader();
  const color = colors();
  const arrow = chalk.red('→');
  const time = new Time();
  time.start('all');
  for (const pathMap of opts.paths) {
    time.start('load');
    const srcPkg = await load(pathMap.src);
    const destPkg = await load(pathMap.dest);
    srcPkg.files = await getPackageFiles(srcPkg);
    // destination is {dest}/node_modules/{src}
    const destPath = path.resolve(
      destPkg.path,
      'node_modules',
      srcPkg.json.name
    );

    const output = {
      src: {
        name: chalk[color(srcPkg)].bold(srcPkg.json.name),
        path: path.relative(cwd, srcPkg.path)
      },
      dest: {
        name: chalk[color(destPkg)].bold(destPkg.json.name),
        path: path.relative(cwd, destPath)
      }
    };

    const pkgLog = ['%s %s %s:', output.src.name, arrow, output.dest.name];
    console.log(
      ...pkgLog,
      chalk.dim(output.src.path),
      arrow,
      chalk.dim(output.dest.path),
      chalk.yellow(time.diff('load'))
    );

    time.start('files');
    const promises = srcPkg.files.map(async file => {
      const { filePath } = file;
      const destFilePath = path.resolve(destPath, filePath);
      const actionColor = options.clean ? 'magenta' : 'blue';
      const actionLabel = chalk[actionColor].bold(
        options.clean ? 'clean' : 'copy'
      );
      time.start(filePath);
      try {
        await (options.clean
          ? removeFile(destFilePath)
          : copyFile(file.path, destFilePath));
        console.log(
          ...pkgLog,
          actionLabel,
          filePath,
          chalk.yellow(time.diff(filePath))
        );
      } catch (error) {
        console.error(
          ...pkgLog,
          chalk.bgRed('error'),
          actionLabel,
          filePath,
          chalk.yellow(time.diff(filePath)),
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

  console.log('done:', chalk.yellow(time.diff('all')));
}
