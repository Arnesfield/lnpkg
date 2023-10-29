import chalk from 'chalk';
import { watch } from 'chokidar';
import { getEntries } from '../helpers/get-entries';
import { Logger } from '../helpers/logger';
import { createLinks } from '../link/link';
import { Runner } from '../runner/runner';
import { LnPkgOptions } from '../types/core.types';
import { Queue } from '../utils/queue';
import { simplifyPaths } from '../utils/simplify-paths';
import { Time } from '../utils/time';

export async function lnpkg(options: LnPkgOptions): Promise<void> {
  const logger = new Logger();
  const time = new Time();
  time.start('links');
  const { links, total } = await createLinks(getEntries(options));
  logger.log(
    { app: true, message: 'Loaded %o packages, %o %s:' },
    total,
    links.length,
    links.length === 1 ? 'link' : 'links',
    chalk.yellow(time.diff('links'))
  );

  const runner = new Runner({ logger, dryRun: options.dryRun });
  if (!options.watchOnly) {
    time.start('main');
    for (const link of links) {
      await runner.link(link);
    }
    logger.log({ app: true }, 'Done:', chalk.yellow(time.diff('main')));
  }
  if (!options.watch && !options.watchOnly) {
    return;
  }

  interface QueueItem {
    event: 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir';
    path: string;
  }
  const addEvents = ['add', 'addDir', 'change'];
  const queue = new Queue<QueueItem>({
    delay: 200,
    normalize(items) {
      const map = new WeakMap<QueueItem, string>();
      const keys = items.map(item => {
        // merge dir events
        const event = addEvents.includes(item.event) ? 'add' : 'unlink';
        const key = event + ':' + item.path;
        map.set(item, key);
        return key;
      });
      const result = simplifyPaths(keys);
      const filtered: QueueItem[] = [];
      for (const item of items) {
        const key = map.get(item);
        if (!key || !result.map[key]) {
          filtered.push(item);
        }
      }
      return filtered;
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

  logger.log({ app: true }, 'Watching for package file changes.');
}
