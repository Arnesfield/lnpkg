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

    console.log(
      '%s %s %s:',
      output.src.name,
      arrow,
      output.dest.name,
      chalk.dim(output.src.path),
      arrow,
      chalk.dim(output.dest.path),
      chalk.yellow(time.diff('load') + 'ms')
    );

    for (const file of srcPkg.files) {
      const { filePath } = file;
      const destFilePath = path.resolve(destPath, filePath);
      time.start('file');
      try {
        await (options.clean
          ? removeFile(destFilePath)
          : copyFile(file.path, destFilePath));
        console.log(
          '%s %s %s:',
          output.src.name,
          arrow,
          output.dest.name,
          chalk.bgGray(options.clean ? 'clean' : 'copy'),
          filePath,
          chalk.yellow(time.diff('file') + 'ms')
        );
      } catch (error) {
        console.error(
          '%s %s %s:',
          output.src.name,
          arrow,
          output.dest.name,
          chalk.bgRed('error'),
          filePath,
          chalk.yellow(time.diff('file') + 'ms'),
          error
        );
      }
    }
  }

  console.log('done:', chalk.yellow(time.diff('all') + 'ms'));
}
