import { Package } from '../package/package';
import { Entry } from '../types/common.types';
import { Link } from './link';

export class Manager {
  readonly links: Link[] = [];
  readonly packages: Package[] = [];
  private readonly linkLookup: {
    [src: string]: { [dest: string]: Link | undefined } | undefined;
  } = Object.create(null);
  private readonly packageMap: { [path: string]: Package | undefined } =
    Object.create(null);
  private readonly nameCount: { [name: string]: number | undefined } =
    Object.create(null);

  getPackage(path: string): Package | undefined {
    return this.packageMap[path];
  }

  stats(): { links: number; packages: number } {
    return {
      links: this.links.length,
      packages: Object.keys(this.packageMap).length
    };
  }

  private getSrcMap(path: string) {
    return (this.linkLookup[path] ||= Object.create(null));
  }

  get(entry: Entry): Link | undefined {
    return this.getSrcMap(entry.src)[entry.dest];
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
      await src.init();
    }
    if (!exists.dest) {
      await dest.init();
    }
    return this.save(new Link(entry.options, src, dest));
  }

  private savePackage(pkg: Package) {
    if (this.packageMap[pkg.path]) {
      return;
    }
    this.packageMap[pkg.path] = pkg;
    this.packages.push(pkg);
    // since package names cannot change once added,
    // keep track of total names for display name.
    // convert to string to handle non string cases (e.g. null, undefined)
    const name = pkg.json.name + '';
    const count = (this.nameCount[name] = (this.nameCount[name] || 0) + 1);
    // for duplicate package names, add <name>+<nth>
    if (count > 1) {
      pkg.displayName = `${name}+${count - 1}`;
    }
  }

  private save(link: Link) {
    // save to map and lookup
    this.savePackage(link.src);
    this.savePackage(link.dest);
    this.getSrcMap(link.src.path)[link.dest.path] = link;
    this.links.push(link);
    return link;
  }
}
