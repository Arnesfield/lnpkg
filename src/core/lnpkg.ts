import chalk from 'chalk';
import path from 'path';
import { Manager } from '../package/manager';
import { copyFile, removeFile } from '../package/package-file';
import { Color, colors } from '../utils/colors';
import { LnPkgOptions } from '../types/core.types';
import { normalizeOptions } from './options';

export async function lnpkg(options: LnPkgOptions = {}): Promise<void> {
  const opts = normalizeOptions(options);
  const cwd = process.cwd();
  const color = colors();
  const manager = new Manager();
  const pkgColorMap: { [pkgPath: string]: Color } = {};
  for (const pathMap of opts.paths) {
    const pkgSrc = await manager.use(pathMap.src);
    const pkgDest = await manager.use(pathMap.dest);
    await pkgSrc.loadFiles();
    const pkgColor = {
      src: (pkgColorMap[pkgSrc.path] ||= color()),
      dest: (pkgColorMap[pkgDest.path] ||= color())
    };

    // destination is {dest}/node_modules/{src}
    const destPath = path.resolve(
      pkgDest.path,
      'node_modules',
      pkgSrc.package.name
    );

    const pkg = {
      src: pkgSrc,
      dest: pkgDest,
      color: pkgColor,
      name: {
        src: chalk[pkgColor.src].bold(pkgSrc.package.name),
        dest: chalk[pkgColor.dest].bold(pkgDest.package.name)
      },
      relative: {
        src: path.relative(cwd, pkgSrc.path),
        dest: path.relative(cwd, destPath)
      }
    };

    const arrow = chalk.red('→');
    console.log(
      '%s %s %s:',
      pkg.name.src,
      arrow,
      pkg.name.dest,
      chalk.dim(pkg.relative.src),
      arrow,
      chalk.dim(pkg.relative.dest)
    );

    for (const file of pkg.src.files) {
      const { filePath } = file;
      const destFilePath = path.resolve(destPath, filePath);
      try {
        await (options.clean
          ? removeFile(destFilePath)
          : copyFile(file.path, destFilePath));
        console.log(
          '%s %s %s:',
          pkg.name.src,
          arrow,
          pkg.name.dest,
          chalk.bgGray(options.clean ? 'clean' : 'copy'),
          chalk.yellow(filePath)
        );
      } catch (error) {
        console.error(
          '%s %s %s:',
          pkg.name.src,
          arrow,
          pkg.name.dest,
          chalk.bgRed('error'),
          chalk.yellow(filePath),
          error
        );
      }
    }
  }
}
