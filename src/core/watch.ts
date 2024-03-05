import { FSWatcher, watch as chokidarWatch } from 'chokidar';
import throttle from 'lodash.throttle';
import path from 'path';
import { findPackageOwner } from '../helpers/find-package-owner';
import { PrefixOptions } from '../helpers/logger';
import { Package } from '../package/package';
import { PackageFile } from '../package/package.types';
import { Batch } from '../utils/batch';
import { Queue } from '../utils/queue';
import { simplifyPaths } from '../utils/simplify-paths';
import { Manager } from './manager';
import { RunType, Runner } from './runner';

type EventName = 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir';

export function watch(manager: Manager, runner: Runner): FSWatcher {
  const runQueue = new Queue<{
    type: RunType;
    package: Package;
    files: PackageFile[]; // assume files has length
  }>(async item => {
    const prefix: PrefixOptions = { time: true };
    // reinitialize only once for package.json changes
    const cachedInit: { [path: string]: PackageFile[] | undefined } = {};
    // find all links with this source package
    for (const link of manager.links) {
      if (link.src !== item.package) {
        continue;
      }
      // reinit if updating package.json
      // NOTE: currently no handler when removing package.json
      if (
        item.type === 'remove' ||
        !item.files.some(file => file.filePath === 'package.json')
      ) {
        await runner.run(item.type, { link, files: item.files, prefix });
        continue;
      }

      // for package.json changes, unlink existing files and reinit
      if (!cachedInit[link.src.path]) {
        // remove package.json to include it in refresh copy
        const files = link.src.files.slice();
        const index = link.src.indexOf('package.json');
        if (index > -1) {
          files.splice(index, 1);
        }
        cachedInit[link.src.path] = files;
        // reinit after caching files to refresh
        await runner.reinit({ link, prefix });
      }
      if (runner.checkLink(link, prefix)) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const files = cachedInit[link.src.path]!;
        await runner.refresh({ link, prefix, files });
      }
    }
  });

  const watchBatch = new Batch<
    Package,
    { event: EventName; file: PackageFile }
  >();

  // throttle before processing batch
  const addEvents = ['add', 'addDir', 'change'];
  const processBatch = throttle(() => {
    // group by type
    const typeBatch = new Batch<RunType, PackageFile>();
    for (const [pkg, items] of watchBatch.flush()) {
      for (const item of items) {
        const type = addEvents.includes(item.event) ? 'copy' : 'remove';
        typeBatch.add(type, item.file);
      }
      for (const [type, files] of typeBatch.flush()) {
        // simplify paths to merge them with directory paths
        const simplified = simplifyPaths(files.map(file => file.path));
        const roots = files.filter(file => simplified.map[file.path] === null);
        if (roots.length === 0) {
          continue;
        }
        runQueue.add({ type, package: pkg, files: roots });
      }
    }
    // need ms to properly simplyfy paths
  }, 100);

  const watchQueue = new Queue<{ event: EventName; path: string }>(
    async item => {
      // get package candidates based on path
      let packages = manager.packages.filter(pkg => {
        return pkg.isPathInPackage(item.path);
      });
      // if updating directory, skip finding package owner
      const isFile = !item.event.includes('Dir');
      const owner = isFile
        ? await findPackageOwner(item.path, packages)
        : undefined;
      if (owner) {
        packages = [owner.package];
      }
      for (const pkg of packages) {
        const file = isFile
          ? owner?.file
          : { filePath: path.relative(pkg.path, item.path), path: item.path };
        // if file does not exist even once, stop loop
        if (!file) {
          break;
        }
        watchBatch.add(pkg, { event: item.event, file });
      }
      processBatch();
    }
  );

  return chokidarWatch(
    manager.links.map(link => link.src.path),
    { ignoreInitial: true }
  ).on('all', (event, path) => watchQueue.add({ event, path }));
}
