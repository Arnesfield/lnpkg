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
      if (item.type === 'init') {
        await runner.reinit(item.link, nth);
        return;
      } else if (item.type === 'check') {
        runner.checkLink(item.link, { nth, time: true });
        return;
      }
      const file = await item.link.src.getFile(item.filePath);
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
    handle: async item => {
      // reinitialize only once for package.json changes
      const didInit: { [path: string]: boolean } = {};
      const isRemove = item.event === 'unlink' || item.event === 'unlinkDir';
      for (const link of manager.links) {
        const file = await link.src.getFile(item.path);
        if (!file) {
          continue;
        } else if (isRemove) {
          runnerQueue.enqueue({ type: 'remove', link, filePath: item.path });
          continue;
        }
        const isPackageJson = file.filePath === 'package.json';
        if (isPackageJson && !didInit[link.src.path]) {
          didInit[link.src.path] = true;
          runnerQueue.enqueue({ type: 'init', link });
        }
        runnerQueue.enqueue({ type: 'copy', link, filePath: item.path });
        if (isPackageJson) {
          runnerQueue.enqueue({ type: 'check', link });
        }
      }
    }
  });

  chokidarWatch(
    manager.links.map(link => link.src.path),
    { ignoreInitial: true }
  ).on('all', (event, path) => watcherQueue.enqueue({ event, path }));
}
