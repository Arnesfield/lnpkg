import chalk from 'chalk';
import path from 'path';
import { copyFile, removeFile } from '../package/package-file';
import { resolvePackage } from '../package/resolve-package';
import { colors } from '../utils/colors';
import { LnPkgOptions } from '../types/core.types';
import { normalizeOptions } from './options';

export async function lnpkg(options: LnPkgOptions = {}): Promise<void> {
  // NOTE: assume resolved packages are consistent while processing occurs
  const opts = normalizeOptions(options);
  const resolvedPkgs = await Promise.all(
    opts.paths.map(pathMap => resolvePackage(pathMap))
  );

  const cwd = process.cwd();
  const color = colors();
  for (const resolved of resolvedPkgs) {
    const pkgName = chalk[color()].bold(resolved.package.name);
    const relative = {
      src: path.relative(cwd, resolved.src),
      dest: path.relative(cwd, resolved.dest)
    };
    console.log(
      '%s:',
      pkgName,
      chalk.dim(relative.src),
      chalk.red('→'),
      chalk.dim(relative.dest)
    );

    for (const file of resolved.files) {
      const filePath = path.relative(resolved.src, file.src);
      try {
        await (options.clean ? removeFile(file) : copyFile(file));
        console.log(
          '%s:',
          pkgName,
          chalk.bgGray(options.clean ? 'clean' : 'copy'),
          chalk.yellow(filePath)
        );
      } catch (error) {
        console.error(
          '%s:',
          pkgName,
          chalk.bgRed('error'),
          chalk.yellow(filePath),
          error
        );
      }
    }
  }
}
