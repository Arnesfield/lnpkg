import chalk from 'chalk';
import { watch } from 'chokidar';
import { name } from '../../package.json';
import { getEntries } from '../helpers/get-entries';
import { createLinks } from '../link/create-links';
import { Runner } from '../runner/runner';
import { LnPkgOptions } from '../types/core.types';
import { Queue } from '../utils/queue';
import { Time } from '../utils/time';

export async function lnpkg(options: LnPkgOptions): Promise<void> {
  const time = new Time();
  time.start('links');
  const { links, total } = await createLinks(getEntries(options));
  const displayName = chalk.bgBlack(name);
  console.log(
    '%s Loaded %o packages, %o %s:',
    displayName,
    total,
    links.length,
    links.length === 1 ? 'link' : 'links',
    chalk.yellow(time.diff('links'))
  );

  const runner = new Runner({ dryRun: options.dryRun });
  if (!options.watchOnly) {
    time.start('main');
    for (const link of links) {
      const copy = link.src.files.map(file => runner.run(link, file, 'copy'));
      await Promise.all(copy);
    }
    console.log('%s Done:', displayName, chalk.yellow(time.diff('main')));
  }
  if (!options.watch && !options.watchOnly) {
    return;
  }

  type EventName = 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir';
  const queue = new Queue<{ event: EventName; path: string }>({
    normalize(items) {
      // TODO: filter out duplicate paths
      return items;
    },
    handle(item) {
      const isRemove = item.event === 'unlink' || item.event === 'unlinkDir';
      for (const link of links) {
        const file = link.src.getFile(item.path);
        if (!file) {
          continue;
        } else if (isRemove) {
          runner.enqueue({ type: 'remove', link, filePath: item.path });
          continue;
        }
        runner.enqueue({ type: 'copy', link, filePath: item.path });
        // reinitialize package for package.json changes
        if (file.filePath === 'package.json') {
          runner.enqueue({ type: 'init', link });
        }
      }
    }
  });

  watch(
    links.map(link => link.src.path),
    { ignoreInitial: true }
  ).on('all', (event, path) => queue.enqueue({ event, path }));

  console.log('%s Watching for package file changes.', displayName);
}
