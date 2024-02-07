import { FSWatcher, watch as chokidarWatch } from 'chokidar';
import { PrefixOptions } from '../helpers/logger';
import { Manager } from '../link/manager';
import { Runner } from '../runner/runner';
import { Queue } from '../utils/queue';
import { simplifyPaths } from '../utils/simplify-paths';
import { Action, WatcherPayload } from './watch.types';

export function watch(manager: Manager, runner: Runner): FSWatcher {
  const runnerQueue = new Queue<Action>({
    async handle(item, index, total) {
      const nth: PrefixOptions['nth'] = { index, total };
      if (item.type === 'init') {
        await runner.reinit(item.link, nth);
        return;
      }
      const file = item.link.src.getFile(item.filePath);
      if (!file) {
        return;
      }
      await runner.run(item.type, {
        nth,
        file,
        link: item.link,
        watchMode: true
      });
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
    handle: item => {
      const isRemove = item.event === 'unlink' || item.event === 'unlinkDir';
      for (const link of manager.links) {
        const file = link.src.getFile(item.path);
        if (!file) {
          continue;
        } else if (isRemove) {
          runnerQueue.enqueue({ type: 'remove', link, filePath: item.path });
          continue;
        }
        runnerQueue.enqueue({ type: 'copy', link, filePath: item.path });
        // reinitialize package for package.json changes
        if (file.filePath === 'package.json') {
          runnerQueue.enqueue({ type: 'init', link });
        }
      }
    }
  });

  const watcher = chokidarWatch(
    manager.links.map(link => link.src.path),
    { ignoreInitial: true }
  ).on('all', (event, path) => watcherQueue.enqueue({ event, path }));
  return watcher;
}
