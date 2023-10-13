import chalk from 'chalk';
import chalkTemplate, { chalkTemplateStderr } from 'chalk-template';
import path from 'path';
import { copyFile, removeFile } from '../package/package-file';
import { resolvePackage } from '../package/resolve-package';
import { colors } from '../utils/colors';

export interface LnPkgOptions {
  target?: string;
  clean?: boolean;
}

export async function lnpkg(
  paths: string[],
  options: LnPkgOptions = {}
): Promise<void> {
  // make sure paths are unique
  const pkgPaths = Array.from(new Set(paths.map(value => path.resolve(value))));
  const resolvedPkgs = await Promise.all(
    pkgPaths.map(pkgPath => resolvePackage(pkgPath, options))
  );

  const cwd = process.cwd();
  const color = colors();
  for (const resolved of resolvedPkgs) {
    const pkgName = color().bold(resolved.package.name);
    const relative = {
      src: path.relative(cwd, resolved.src),
      dest: path.relative(cwd, resolved.dest)
    };
    console.log(
      chalkTemplate`%s: {dim %s} {red →} {dim %s}`,
      pkgName,
      relative.src,
      relative.dest
    );

    if (resolved.src === resolved.dest) {
      const error = Error('Cannot link to the same directory.');
      console.error(
        chalkTemplateStderr`%s: {bgRed error} {dim %s}`,
        pkgName,
        relative.src,
        error
      );
      continue;
    }

    const doneFiles: string[] = [];
    for (const file of resolved.files) {
      const filePath = path.relative(resolved.src, file.src);
      try {
        await (options.clean ? removeFile(file) : copyFile(file));
        doneFiles.push(filePath);
      } catch (error) {
        console.error(
          chalkTemplateStderr`%s: {bgRed error} {yellow %s}`,
          pkgName,
          filePath,
          error
        );
      }
    }

    if (doneFiles.length > 0) {
      console.log(
        chalkTemplate`%s: {bgGray %s}`,
        pkgName,
        options.clean ? 'clean' : 'copy',
        doneFiles.map(file => chalk.yellow(file)).join(', ')
      );
    }
  }
}
