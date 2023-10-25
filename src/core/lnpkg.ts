import chalk from 'chalk';
import { FSWatcher } from 'chokidar';
import path from 'path';
import { name } from '../../package.json';
import { getEntries } from '../helpers/get-entries';
import { prettyLinks } from '../helpers/pretty-links';
import { createLinks } from '../link/create-links';
import { Link } from '../link/link';
import { LnPkgOptions } from '../types/core.types';
import { PackageFile } from '../types/package.types';
import { formatTime } from '../utils/format-time';
import { Time } from '../utils/time';

export async function lnpkg(options: LnPkgOptions): Promise<void> {
  const time = new Time();
  time.start('main');
  time.start('links');
  const links = await createLinks(getEntries(options));
  console.log(
    '%s Loaded %o %s:',
    chalk.bgBlack(name),
    links.length,
    links.length === 1 ? 'entry' : 'entries',
    chalk.yellow(time.diff('links'))
  );

  const cwd = process.cwd();
  const getPrefix = prettyLinks();

  async function applyLink(link: Link, file: PackageFile, watchMode = false) {
    const key = [link.src.path, link.dest.path, file.path].join(':');
    const logs = () => {
      const logs = [
        chalk.bold.blue('copy'),
        file.filePath,
        chalk.yellow(time.diff(key))
      ];
      if (watchMode) {
        logs.push(
          '(' + chalk.dim(path.relative(cwd, file.path)),
          chalk.red('→'),
          chalk.dim(path.relative(cwd, link.getDestPath(file.filePath))) + ')'
        );
      }
      return logs;
    };
    const prefix = getPrefix(link);
    if (watchMode) {
      prefix[0] = '[%s] ' + prefix[0];
      prefix.splice(1, 0, chalk.gray(formatTime(new Date())));
    }
    time.start(key);
    try {
      // TODO: handle/remove clean?
      if (await link.copy(file.path)) {
        console.log(...prefix, ...logs());
      } else {
        time.clear(key);
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

  if (!options.watch || options.watchAfter) {
    for (const link of links) {
      const prefix = getPrefix(link);
      console.log(
        ...prefix,
        chalk.bold.blue('load'),
        chalk.dim(path.relative(cwd, link.src.path)),
        chalk.red('→'),
        chalk.dim(path.relative(cwd, link.getDestPath()))
      );

      time.start('files');
      const promises = link.src.files.map(file => applyLink(link, file));
      await Promise.all(promises);

      console.log(
        ...prefix,
        chalk.bold.green('done'),
        chalk.yellow(time.diff('files'))
      );
    }

    console.log(
      '%s Done:',
      chalk.bgBlack(name),
      chalk.yellow(time.diff('main'))
    );
  }

  if (!options.watch && !options.watchAfter) {
    return;
  }

  console.log('%s Watching for package file changes.', chalk.bgBlack(name));

  const watcher = new FSWatcher();
  for (const link of links) {
    for (const file of link.src.files) {
      watcher.add(file.path);
    }
  }
  // TODO: handle removed files, etc
  watcher.on('change', async filePath => {
    for (const link of links) {
      const file = link.src.getFile(filePath);
      // TODO: reinitialize package for package.json changes
      if (file) {
        await applyLink(link, file, true);
      }
    }
  });
}
