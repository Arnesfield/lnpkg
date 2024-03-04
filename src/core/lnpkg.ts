import chalk from 'chalk';
import { FSWatcher } from 'chokidar';
import { getEntries } from '../helpers/get-entries';
import { Logger } from '../helpers/logger';
import { errorLog } from '../utils/error';
import { pluralize } from '../utils/pluralize';
import { Timer } from '../utils/timer';
import { Link } from './link';
import { LnPkg, LnPkgOptions } from './lnpkg.types';
import { Manager } from './manager';
import { Runner } from './runner';
import { watch } from './watch';

/**
 * Link local Node.js packages.
 * @param options Link package options.
 * @returns The LnPkg object.
 */
export async function lnpkg(options: LnPkgOptions): Promise<LnPkg> {
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
      logger.error({ error: true }, errorLog(error), message());
      continue;
    }
    if (runner.checkLink(link, { message: message() }) && !watchOnly) {
      await runner.run('copy', { link, files: link.src.files });
    }
  }

  // NOTE: exposing lnpkg object means that the
  // referenced objects are kept in memory (probably)
  let watcher: FSWatcher | undefined;
  const lnpkg: LnPkg = {
    stats: () => ({ ...manager.stats(), ...logger.stats }),
    isWatching: () => !!watcher,
    async close() {
      await watcher?.close();
      watcher = undefined;
    }
  };

  const s = lnpkg.stats();
  logger.log(
    { app: true, message: 'Found %o %s, %o %s (%o %s, %o %s) in' },
    s.packages,
    pluralize('package', s.packages),
    s.links,
    pluralize('link', s.links),
    s.errors,
    pluralize('error', s.errors),
    s.warnings,
    pluralize('warning', s.warnings),
    chalk.yellow(timer.diff('main'))
  );

  // watch only if links are available
  if (manager.links.length > 0 && (options.watch || watchOnly)) {
    watcher = watch(manager, runner);
    logger.log({ app: true }, 'Watching for package file changes.');
  }
  return lnpkg;
}
