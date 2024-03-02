import { watch as chokidarWatch } from 'chokidar';
import { Manager } from '../core/manager';
import { Runner } from '../core/runner';
import { PrefixOptions } from '../helpers/logger';
import { PackageFile } from '../package/package.types';
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
      // reinitialize only once for package.json changes
      const didInit: { [path: string]: PackageFile[] | undefined } = {};
      const isRemove = item.event === 'unlink' || item.event === 'unlinkDir';
      for (const link of manager.links) {
        const file = await link.src.getFile(item.path);
        if (!file) {
          continue;
        } else if (isRemove) {
          runnerQueue.enqueue({ type: 'remove', link, file });
          continue;
        } else if (file.filePath !== 'package.json') {
          runnerQueue.enqueue({ type: 'copy', link, file });
          continue;
        }
        // for package.json, unlink existing files and reinit
        // assume that package files array is not mutated
        const shouldInit = !didInit[link.src.path];
        const files = (didInit[link.src.path] ||= link.src.files);
        // TODO: probably create a smart unlink, unlink only files not in reloaded files?
        runnerQueue.enqueue({ type: 'unlink', link, files });
        if (shouldInit) {
          runnerQueue.enqueue({ type: 'init', link });
        }
        runnerQueue.enqueue({ type: 'link', link });
      }
    }
  });

  chokidarWatch(
    manager.links.map(link => link.src.path),
    { ignoreInitial: true }
  ).on('all', (event, path) => watcherQueue.enqueue({ event, path }));
}
