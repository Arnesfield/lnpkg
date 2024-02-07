import chalk from 'chalk';
import { getEntries } from '../helpers/get-entries';
import { Logger } from '../helpers/logger';
import { Manager } from '../link/manager';
import { Runner } from '../runner/runner';
import { LnPkgOptions } from '../types/core.types';
import { Time } from '../utils/time';
import { watch } from '../watch/watch';

export async function lnpkg(options: LnPkgOptions): Promise<void> {
  const logger = new Logger();
  const manager = new Manager();
  const runner = new Runner(logger, options);
  const time = new Time();

  time.start('links');
  const entries = getEntries(options);
  const links = await manager.add(entries);
  const count = manager.count();
  logger.log(
    { app: true, message: 'Loaded %o packages, %o %s:' },
    count.packages,
    count.links,
    count.links === 1 ? 'link' : 'links',
    chalk.yellow(time.diff('links'))
  );

  if (options.watchOnly) {
    for (const link of links) {
      runner.checkLink(link);
    }
  } else {
    time.start('main');
    for (const link of links) {
      if (runner.checkLink(link)) {
        await runner.link(link);
      }
    }
    logger.log({ app: true }, 'Done:', chalk.yellow(time.diff('main')));
  }

  if (options.watch || options.watchOnly) {
    watch(manager, runner);
    logger.log({ app: true }, 'Watching for package file changes.');
  }
}
