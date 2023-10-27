import chalk from 'chalk';
import { watch } from 'chokidar';
import { name } from '../../package.json';
import { getEntries } from '../helpers/get-entries';
import { createLinks } from '../link/create-links';
import { Runner } from '../runner/runner';
import { LnPkgOptions } from '../types/core.types';
import { Time } from '../utils/time';

export async function lnpkg(options: LnPkgOptions): Promise<void> {
  const time = new Time();
  time.start('links');
  const links = await createLinks(getEntries(options));
  const displayName = chalk.bgBlack(name);
  console.log(
    '%s Loaded %o %s:',
    displayName,
    links.length,
    links.length === 1 ? 'entry' : 'entries',
    chalk.yellow(time.diff('links'))
  );

  const runner = new Runner({ dryRun: options.dryRun });
  const { watch: isWatch, watchAfter } = options;
  if (!isWatch || watchAfter) {
    time.start('main');
    for (const link of links) {
      const copy = link.src.files.map(file => runner.run(link, file, 'copy'));
      await Promise.all(copy);
    }
    console.log('%s Done:', displayName, chalk.yellow(time.diff('main')));
  }

  if (!isWatch && !watchAfter) {
    return;
  }

  const watcher = watch(
    links.map(link => link.src.path),
    { ignoreInitial: true }
  );
  watcher.on('all', (eventName, filePath) => {
    const isRemove = eventName === 'unlink' || eventName === 'unlinkDir';
    for (const link of links) {
      const file = link.src.getFile(filePath);
      if (!file) {
        continue;
      } else if (isRemove) {
        runner.enqueue({ type: 'remove', link, filePath });
        continue;
      }
      runner.enqueue({ type: 'copy', link, filePath });
      // reinitialize package for package.json changes
      if (file.filePath === 'package.json') {
        runner.enqueue({ type: 'init', link });
      }
    }
  });

  console.log('%s Watching for package file changes.', displayName);
}
