import chalk from 'chalk';
import { getEntries } from '../helpers/get-entries';
import { Logger } from '../helpers/logger';
import { Link } from '../link/link';
import { Manager } from '../link/manager';
import { Runner } from '../runner/runner';
import { LnPkgOptions } from '../types/core.types';
import { Timer } from '../utils/timer';
import { watch } from '../watch/watch';

export async function lnpkg(options: LnPkgOptions): Promise<void> {
  const entries = await getEntries(options);
  if (entries.length === 0) {
    throw new Error('No entries found.');
  }

  const logger = new Logger();
  const manager = new Manager();
  const runner = new Runner(logger, options);
  const timer = new Timer();
  const { watchOnly } = options;

  const message = () => chalk.yellow(timer.diff('entry'));
  timer.start('main');
  for (const entry of entries) {
    // skip if existing link
    if (manager.get(entry)) {
      continue;
    }
    let link: Link;
    timer.start('entry');
    try {
      link = await manager.create(entry);
    } catch (error) {
      logger.error(
        { error: true },
        error instanceof Error ? error.toString() : error,
        message()
      );
      continue;
    }
    if (runner.checkLink(link, { message: message() }) && !watchOnly) {
      await runner.link(link);
    }
  }

  const count = manager.count();
  logger.log(
    { app: true, message: 'Loaded %o packages, %o %s:' },
    count.packages,
    count.links,
    count.links === 1 ? 'link' : 'links',
    chalk.yellow(timer.diff('main'))
  );

  if (options.watch || watchOnly) {
    watch(manager, runner);
    if (manager.links.length > 0) {
      logger.log({ app: true }, 'Watching for package file changes.');
    }
  }
}
