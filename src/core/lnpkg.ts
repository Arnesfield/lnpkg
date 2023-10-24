import chalk from 'chalk';
import { FSWatcher } from 'chokidar';
import path from 'path';
import { getEntries } from '../helpers/get-entries';
import { prettyLinks } from '../helpers/pretty-links';
import { createLinks } from '../link/create-links';
import { Link } from '../link/link';
import { LnPkgOptions } from '../types/core.types';
import { PackageFile } from '../types/package.types';
import { Time } from '../utils/time';

export async function lnpkg(options: LnPkgOptions): Promise<void> {
  const time = new Time();
  time.start('main');
  time.start('links');
  const links = await createLinks(getEntries(options));
  console.log(
    'loaded %o %s:',
    links.length,
    links.length === 1 ? 'entry' : 'entries',
    chalk.yellow(time.diff('links'))
  );

  const getPrefix = prettyLinks();

  async function applyLink(link: Link, file: PackageFile) {
    const key = [link.src.path, link.dest.path, file.path].join(':');
    const logs = () => [
      chalk.bold.blue('copy'),
      file.filePath,
      chalk.yellow(time.diff(key))
    ];
    const prefix = getPrefix(link);
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

  const cwd = process.cwd();
  for (const link of links) {
    const logs = () => [
      chalk.bold.blue('load'),
      chalk.dim(path.relative(cwd, link.src.path)),
      chalk.red('→'),
      chalk.dim(path.relative(cwd, link.getDestPath())),
      chalk.yellow(time.diff('load'))
    ];
    const prefix = getPrefix(link);
    time.start('load');
    try {
      await link.src.loadFiles();
      console.log(...prefix, ...logs());
    } catch (error) {
      console.error(
        ...prefix,
        chalk.bgRed('error'),
        ...logs(),
        error instanceof Error ? error.toString() : error
      );
    }

    time.start('files');
    const promises = link.src.files.map(file => applyLink(link, file));
    await Promise.all(promises);

    console.log(
      ...prefix,
      chalk.bold.green('done'),
      chalk.yellow(time.diff('files'))
    );
  }

  console.log('done:', chalk.yellow(time.diff('main')));

  // watch mode
  if (!options.watch) {
    return;
  }

  const watcher = new FSWatcher();
  for (const link of links) {
    for (const file of link.src.files) {
      watcher.add(file.path);
    }
  }
  watcher.on('change', async filePath => {
    for (const link of links) {
      const file = link.src.getFile(filePath);
      if (file) {
        await applyLink(link, file);
      }
    }
  });
}
