import chalk from 'chalk';
import { getEntries } from '../helpers/get-entries';
import { Logger } from '../helpers/logger';
import { Link } from '../link/link';
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
  const entries = getEntries(options);
  const { watchOnly } = options;

  const message = () => chalk.yellow(time.diff('entry'));
  time.start('main');
  for (const entry of entries) {
    // skip if existing link
    if (manager.get(entry)) {
      continue;
    }
    let link: Link;
    time.start('entry');
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
    chalk.yellow(time.diff('main'))
  );

  if (options.watch || watchOnly) {
    watch(manager, runner);
    logger.log({ app: true }, 'Watching for package file changes.');
  }
}
