import { watch as chokidarWatch } from 'chokidar';
import throttle from 'lodash.throttle';
import { findPackageOwner } from '../helpers/find-package-owner';
import { PrefixOptions } from '../helpers/logger';
import { Package } from '../package/package';
import { PackageFile } from '../package/package.types';
import { Batch } from '../utils/batch';
import { Queue } from '../utils/queue';
import { Manager } from './manager';
import { Runner } from './runner';

type EventName = 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir';

export function watch(manager: Manager, runner: Runner): void {
  const runQueue = new Queue<{
    package: Package;
    event: EventName;
    files: PackageFile[];
  }>({
    async handle(item, index, total) {
      if (item.files.length === 0) {
        return;
      }
      const prefix: PrefixOptions = { time: true, nth: { index, total } };
      // reinitialize only once for package.json changes
      const didInit: {
        [path: string]:
          | { files: PackageFile[]; copy: PackageFile[] }
          | undefined;
      } = {};
      // find all links with this source package
      for (const link of manager.links) {
        if (link.src !== item.package) {
          continue;
        }
        const { event, files } = item;
        // reinit if updating package.json
        // NOTE: currently no handler when removing package.json
        const isRemove = event === 'unlink' || event === 'unlinkDir';
        if (isRemove || !files.some(file => file.filePath === 'package.json')) {
          await runner.run(isRemove ? 'remove' : 'copy', {
            link,
            files,
            prefix
          });
          continue;
        }

        // for package.json changes, unlink existing files and reinit
        if (!didInit[link.src.path]) {
          const { files } = link.src;
          const pkgJson = files.find(file => file.filePath === 'package.json');
          didInit[link.src.path] = { files, copy: pkgJson ? [pkgJson] : [] };
          // reinit after caching files to refresh
          await runner.reinit({ link, prefix });
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const cached = didInit[link.src.path]!;
        if (runner.checkLink(link, prefix)) {
          await runner.refresh({ link, prefix, ...cached });
        }
      }
    }
  });

  // package path -> payload
  const watchBatch = new Batch<
    Package,
    { event: EventName; file: PackageFile }
  >();

  // throttle before processing batch
  const processBatch = throttle(() => {
    // group by events
    const eventBatch = new Batch<EventName, PackageFile>();
    for (const [pkg, items] of watchBatch.flush()) {
      for (const item of items) {
        eventBatch.add(item.event, item.file);
      }
      for (const [event, files] of eventBatch.flush()) {
        runQueue.enqueue({ package: pkg, event, files });
      }
    }
  });

  const watchQueue = new Queue<{ event: EventName; path: string }>({
    async handle(item) {
      const owner = await findPackageOwner(item.path, manager.packages);
      if (!owner) {
        return;
      }
      watchBatch.add(owner.package, { event: item.event, file: owner.file });
      processBatch();
    }
  });

  // ignore anything coming from node_modules
  // otherwise, file changes may include symlinks (monorepo)
  chokidarWatch(
    manager.links.map(link => link.src.path),
    { ignoreInitial: true, ignored: /(?:^|\/)(?:node_modules)(?:$|\/)/ }
  ).on('all', (event, path) => watchQueue.enqueue({ event, path }));
}
