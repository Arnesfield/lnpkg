import { watch as chokidarWatch } from 'chokidar';
import { PrefixOptions } from '../helpers/logger';
import { Manager } from '../link/manager';
import { Runner } from '../runner/runner';
import { Queue } from '../utils/queue';
import { simplifyPaths } from '../utils/simplify-paths';
import { Action, WatcherPayload } from './watch.types';

export function watch(manager: Manager, runner: Runner): void {
  const runnerQueue = new Queue<Action>({
    async handle(item, index, total) {
      const nth: PrefixOptions['nth'] = { index, total };
      const { link } = item;
      switch (item.type) {
        case 'init':
          await runner.reinit(link, nth);
          break;
        case 'link':
          if (runner.checkLink(link, { nth, time: true })) {
            await runner.link(link);
          }
          break;
        case 'unlink':
          await Promise.all(
            item.files.map(file => runner.run('remove', { link, file }))
          );
          break;
        default:
          await runner.run(item.type, {
            nth,
            link,
            file: item.file,
            watchMode: true
          });
      }
    }
  });

  const addEvents = ['add', 'addDir', 'change'];
  const watcherQueue = new Queue<WatcherPayload>({
    delay: 200,
    normalize: items => {
      const map = new WeakMap<WatcherPayload, string>();
      const keys = items.map(item => {
        // merge dir events
        const event = addEvents.includes(item.event) ? 'add' : 'unlink';
        const key = event + ':' + item.path;
        map.set(item, key);
        return key;
      });
      const result = simplifyPaths(keys);
      const filtered: WatcherPayload[] = [];
      for (const item of items) {
        const key = map.get(item);
        if (!key || !result.map[key]) {
          filtered.push(item);
        }
      }
      return filtered;
    },
    handle: async item => {
      const isRemove = item.event === 'unlink' || item.event === 'unlinkDir';
      for (const link of manager.links) {
        const file = await link.src.getFile(item.path);
        if (!file) {
          continue;
        } else if (isRemove) {
          runnerQueue.enqueue({ type: 'remove', link, file });
          continue;
        }
        const isPackageJson = file.filePath === 'package.json';
        if (isPackageJson) {
          runnerQueue.enqueue(
            { type: 'unlink', link, files: link.src.files },
            { type: 'init', link },
            { type: 'link', link }
          );
        } else {
          runnerQueue.enqueue({ type: 'copy', link, file });
        }
      }
    }
  });

  chokidarWatch(
    manager.links.map(link => link.src.path),
    { ignoreInitial: true }
  ).on('all', (event, path) => watcherQueue.enqueue({ event, path }));
}
