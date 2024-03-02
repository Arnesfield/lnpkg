import { Package } from '../package/package';
import { Link } from './link';

export interface Entry {
  src: string;
  dest: string;
}

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

  get(entry: Entry): Link | undefined {
    const srcMap = (this.linkLookup[entry.src] ||= {});
    return srcMap[entry.dest];
  }

  // NOTE: should add new link to watcher when necessary
  async create(entry: Entry): Promise<Link> {
    const exists = {
      src: this.packageMap[entry.src],
      dest: this.packageMap[entry.dest]
    };
    const src = exists.src || new Package(entry.src);
    const dest = exists.dest || new Package(entry.dest);
    if (!exists.src) {
      await src.init(true);
    }
    if (!exists.dest) {
      await dest.init(false);
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