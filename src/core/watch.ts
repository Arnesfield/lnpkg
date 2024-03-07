import { FSWatcher, watch as chokidarWatch } from 'chokidar';
import throttle from 'lodash.throttle';
import path from 'path';
import { RunItem, runItem } from '../helpers/run-item';
import { Package } from '../package/package';
import { PackageFile } from '../package/package.types';
import { Batch } from '../utils/batch';
import { Queue } from '../utils/queue';
import { simplifyPaths } from '../utils/simplify-paths';
import { Link } from './link';
import { RunType, Runner } from './runner';

type EventName = 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir';

interface WatchQueueItem {
  path: string;
  event: EventName;
  packages: Package[];
}

export function watch(links: Link[], runner: Runner): FSWatcher {
  const removeEvents: EventName[] = ['unlink', 'unlinkDir'];
  const watchBatch = new Batch<
    Package,
    { event: EventName; file: PackageFile }
  >();

  async function batchItems(items: WatchQueueItem[]) {
    // avoid refreshing files more than once
    const didLoadFiles: { [path: string]: boolean } = Object.create(null);
    for (const item of items) {
      const { event } = item;
      const isFile = !event.includes('Dir');
      for (const pkg of item.packages) {
        // if updating directory, skip finding package owner
        if (!isFile) {
          watchBatch.add(pkg, {
            event,
            file: {
              path: item.path,
              filePath: path.relative(pkg.path, item.path)
            }
          });
          continue;
        }
        // find package owner
        const file = await pkg.getFile(item.path, !didLoadFiles[pkg.path]);
        didLoadFiles[pkg.path] = true;
        if (file) {
          watchBatch.add(pkg, { event, file });
          break;
        }
      }
    }
  }

  function processBatch() {
    // group by type
    const run: RunItem[] = [];
    const typeBatch = new Batch<RunType, PackageFile>();
    for (const [pkg, items] of watchBatch.flush()) {
      for (const item of items) {
        const type = removeEvents.includes(item.event) ? 'remove' : 'copy';
        typeBatch.add(type, item.file);
      }
      for (const [type, files] of typeBatch.flush()) {
        // simplify paths to merge them with directory paths
        const simplified = simplifyPaths(files.map(file => file.path));
        const roots = files.filter(file => simplified.map[file.path] === null);
        if (roots.length === 0) {
          continue;
        }
        run.push({ type, package: pkg, files: roots });
      }
    }
    return run;
  }

  const watchQueue = new Queue<WatchQueueItem[]>(async items => {
    await batchItems(items);
    for (const item of processBatch()) {
      await runItem(item, links, runner);
    }
  });

  // only process the last known event of a certain path: path -> event
  let watchMap: { [path: string]: EventName } = Object.create(null);
  const sourcePackages = Array.from(new Set(links.map(link => link.src)));
  const processWatch = throttle(
    () => {
      const events = watchMap;
      // unset for next batch
      watchMap = Object.create(null);
      // get package candidates based on path
      const items: WatchQueueItem[] = [];
      for (const path in events) {
        items.push({
          path,
          event: events[path],
          packages: sourcePackages.filter(pkg => pkg.isPathInPackage(path))
        });
      }
      watchQueue.add(items);
    },
    100,
    { leading: false }
  );

  return chokidarWatch(
    links.map(link => link.src.path),
    { ignoreInitial: true, disableGlobbing: true }
  ).on('all', (event, path) => {
    // remove to update key value order
    if (path in watchMap) {
      delete watchMap[path];
    }
    watchMap[path] = event;
    processWatch();
  });
}
