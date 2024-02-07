import { Package } from '../package/package';
import { Entry } from '../types/core.types';
import { Link } from './link';

export class Manager {
  readonly links: Link[] = [];
  private readonly linkLookup: {
    [src: string]: { [dest: string]: Link | undefined } | undefined;
  } = {};
  private readonly packageMap: { [path: string]: Package | undefined } = {};

  count(): { links: number; packages: number } {
    return {
      links: this.links.length,
      packages: Object.keys(this.packageMap).length
    };
  }

  async add(entries: Entry[]): Promise<Link[]> {
    // ensure unique links
    const links = new Set<Link>();
    for (const entry of entries) {
      const existing = this.get(entry);
      if (existing) {
        links.add(existing);
        continue;
      }
      const link = await this.create(entry);
      // NOTE: should add new link to watcher when necessary
      links.add(link);
    }
    return Array.from(links);
  }

  private get(entry: Entry): Link | undefined {
    const srcMap = (this.linkLookup[entry.src] ||= {});
    return srcMap[entry.dest];
  }

  private async create(entry: Entry) {
    const exists = {
      src: this.packageMap[entry.src],
      dest: this.packageMap[entry.dest]
    };
    const src = exists.src || new Package(entry.src);
    const dest = exists.dest || new Package(entry.dest);
    if (!exists.src) {
      await src.init();
    }
    if (!exists.dest) {
      await dest.init();
    }
    await src.loadFiles();
    return this.save(new Link(src, dest));
  }

  private save(link: Link) {
    // save to map and lookup
    this.packageMap[link.src.path] = link.src;
    this.packageMap[link.dest.path] = link.dest;
    const srcMap = (this.linkLookup[link.src.path] ||= {});
    srcMap[link.dest.path] = link;
    this.links.push(link);
    return link;
  }
}
