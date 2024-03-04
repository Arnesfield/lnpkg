import { Package } from '../package/package';
import { Link } from './link';

export interface Entry {
  src: string;
  dest: string;
}

export class Manager {
  readonly links: Link[] = [];
  readonly packages: Package[] = [];
  private readonly linkLookup: {
    [src: string]: { [dest: string]: Link | undefined } | undefined;
  } = {};
  private readonly packageMap: { [path: string]: Package | undefined } = {};

  getPackage(path: string): Package | undefined {
    return this.packageMap[path];
  }

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

  async create(entry: Entry): Promise<Link> {
    // NOTE: should add new link to watcher when necessary
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

  private savePackages(...packages: Package[]) {
    for (const pkg of packages) {
      if (!this.packageMap[pkg.path]) {
        this.packageMap[pkg.path] = pkg;
        this.packages.push(pkg);
      }
    }
  }

  private save(link: Link) {
    // save to map and lookup
    this.savePackages(link.src, link.dest);
    const srcMap = (this.linkLookup[link.src.path] ||= {});
    srcMap[link.dest.path] = link;
    this.links.push(link);
    return link;
  }
}
