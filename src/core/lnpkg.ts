import chalk from 'chalk';
import { FSWatcher } from 'chokidar';
import { name } from '../../package.json';
import { getEntries } from '../helpers/get-entries';
import { createLinks } from '../link/create-links';
import { LnPkgOptions } from '../types/core.types';
import { Time } from '../utils/time';
import { Runner } from './runner';

export async function lnpkg(options: LnPkgOptions): Promise<void> {
  const runner = new Runner();
  const time = new Time();
  time.start('main');
  time.start('links');
  const links = await createLinks(getEntries(options));
  const displayName = chalk.bgBlack(name);
  console.log(
    '%s Loaded %o %s:',
    displayName,
    links.length,
    links.length === 1 ? 'entry' : 'entries',
    chalk.yellow(time.diff('links'))
  );

  const { watch, watchAfter } = options;
  if (!watch || watchAfter) {
    await runner.runAll(links);
  }
  if (!watch && !watchAfter) {
    return;
  }

  console.log('%s Done:', displayName, chalk.yellow(time.diff('main')));

  const watcher = new FSWatcher();
  // TODO: handle added files?
  watcher.on('change', async filePath => {
    for (const link of links) {
      const file = link.src.getFile(filePath);
      if (!file) {
        return;
      }
      await runner.run(link, file, true);
      // reinitialize package for package.json changes
      if (file.filePath === 'package.json') {
        await runner.reinit(link.src);
      }
    }
  });

  console.log('%s Watching for package file changes.', displayName);
  for (const link of links) {
    watcher.add(link.src.path);
  }
}
