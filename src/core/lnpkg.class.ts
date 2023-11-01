import { FSWatcher, watch } from 'chokidar';
import { getEntries } from '../helpers/get-entries';
import { Logger } from '../helpers/logger';
import { Manager } from '../link/manager';
import { Link } from '../link/link';
import { Runner } from '../runner/runner';
import { Entry, LnPkg, LnPkgOptions } from '../types/core.types';
import { Queue } from '../utils/queue';
import { simplifyPaths } from '../utils/simplify-paths';

// NOTE: internal

interface WatcherPayload {
  event: 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir';
  path: string;
}

export class LnPkgClass implements LnPkg {
  private readonly manager = new Manager();
  private readonly runner: Runner;
  private watcher: FSWatcher | undefined;
  private watcherQueue: Queue<WatcherPayload> | undefined;

  constructor(logger: Logger, private readonly options: LnPkgOptions) {
    this.runner = new Runner(logger, options);
  }

  private getWatcherQueue() {
    if (this.watcherQueue) {
      return this.watcherQueue;
    }
    const addEvents = ['add', 'addDir', 'change'];
    this.watcherQueue = new Queue<WatcherPayload>({
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
        for (const link of this.manager.links) {
          const file = link.src.getFile(item.path);
          if (!file) {
            continue;
          } else if (isRemove) {
            this.runner.enqueue({ type: 'remove', link, filePath: item.path });
            continue;
          }
          this.runner.enqueue({ type: 'copy', link, filePath: item.path });
          // reinitialize package for package.json changes
          if (file.filePath === 'package.json') {
            this.runner.enqueue({ type: 'init', link });
          }
        }
      }
    });
    return this.watcherQueue;
  }

  private async createLinks(
    items: string | Entry | (string | Entry)[]
  ): Promise<Link[]> {
    // ensure unique links
    const links = new Set<Link>();
    const entries = getEntries({
      items,
      cwd: this.options.cwd,
      dest: this.options.dest
    });
    for (const entry of entries) {
      const existing = this.manager.get(entry);
      if (existing) {
        links.add(existing);
        continue;
      }
      const link = await this.manager.create(entry);
      // add link when successfully created
      links.add(link);
      this.watcher?.add(link.src.path);
    }
    return Array.from(links);
  }

  count(): { links: number; packages: number } {
    return this.manager.count();
  }

  async add(paths: string | Entry | (string | Entry)[]): Promise<void> {
    await this.createLinks(paths);
  }

  async link(
    paths: string | Entry | (string | Entry)[],
    checkOnly = false
  ): Promise<void> {
    const links = await this.createLinks(paths);
    for (const link of links) {
      if (this.runner.checkLink(link) && !checkOnly) {
        await this.runner.link(link);
      }
    }
  }

  watch(): { close(): Promise<void> } {
    const watcher = (this.watcher = watch(
      this.manager.links.map(link => link.src.path),
      { ignoreInitial: true }
    ).on('all', (event, path) => {
      this.getWatcherQueue().enqueue({ event, path });
    }));
    return {
      close: async () => {
        // remove watcher
        this.watcher = undefined;
        await watcher.close();
      }
    };
  }
}
