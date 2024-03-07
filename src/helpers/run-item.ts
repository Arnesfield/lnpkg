import { Link } from '../core/link';
import { RunType, Runner } from '../core/runner';
import { Package } from '../package/package';
import { PackageFile } from '../package/package.types';
import { PrefixOptions } from './logger';

export interface RunItem {
  type: RunType;
  package: Package;
  files: PackageFile[];
}

export async function runItem(
  item: RunItem,
  links: Link[],
  runner: Runner
): Promise<void> {
  const prefix: PrefixOptions = { time: true };
  // reinitialize only once for package.json changes
  const cachedFiles: { [path: string]: PackageFile[] | undefined } =
    Object.create(null);
  // find all links with this source package
  for (const link of links) {
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
    if (!cachedFiles[link.src.path]) {
      // remove package.json to include it in refresh copy
      const files = (await link.src.files()).slice();
      const index = link.src.indexOf('package.json');
      if (index > -1) {
        files.splice(index, 1);
      }
      cachedFiles[link.src.path] = files;
      // reinit after caching files to refresh
      await runner.reinit({ link, prefix });
    }
    if (runner.checkLink(link, prefix)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const files = cachedFiles[link.src.path]!;
      await runner.refresh({ link, files, prefix });
    }
  }
}
