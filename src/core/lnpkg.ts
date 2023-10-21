import chalk from 'chalk';
import path from 'path';
import { Manager } from '../package/manager';
import { copyFile, removeFile } from '../package/package-file';
import { resolvePackageFiles } from '../package/resolve-package-files';
import { LnPkgOptions } from '../types/core.types';
import { PackageFile } from '../types/package.types';
import { Color, colors } from '../utils/colors';
import { normalizeOptions } from './options';

export async function lnpkg(options: LnPkgOptions): Promise<void> {
  const opts = normalizeOptions(options);
  const cwd = process.cwd();
  const color = colors();
  const arrow = chalk.red('→');
  const manager = new Manager();
  const pkgColorMap: { [pkgPath: string]: Color } = {};
  for (const pathMap of opts.paths) {
    const pkgSrc = await manager.use(pathMap.src);
    const pkgDest = await manager.use(pathMap.dest);
    // load pkgSrc files if not loaded yet
    pkgSrc.files ||= (await resolvePackageFiles(pkgSrc.path, pkgSrc.json)).map(
      (filePath): PackageFile => {
        return { filePath, path: path.resolve(pkgSrc.path, filePath) };
      }
    );
    // destination is {dest}/node_modules/{src}
    const destPath = path.resolve(
      pkgDest.path,
      'node_modules',
      pkgSrc.json.name
    );

    const pkgColor = {
      src: (pkgColorMap[pkgSrc.path] ||= color()),
      dest: (pkgColorMap[pkgDest.path] ||= color())
    };
    const output = {
      src: {
        name: chalk[pkgColor.src].bold(pkgSrc.json.name),
        path: path.relative(cwd, pkgSrc.path)
      },
      dest: {
        name: chalk[pkgColor.dest].bold(pkgDest.json.name),
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
      chalk.dim(output.dest.path)
    );

    for (const file of pkgSrc.files) {
      const { filePath } = file;
      const destFilePath = path.resolve(destPath, filePath);
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
          chalk.yellow(filePath)
        );
      } catch (error) {
        console.error(
          '%s %s %s:',
          output.src.name,
          arrow,
          output.dest.name,
          chalk.bgRed('error'),
          chalk.yellow(filePath),
          error
        );
      }
    }
  }
}
