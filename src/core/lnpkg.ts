import chalk from 'chalk';
import { FSWatcher } from 'chokidar';
import { getEntries } from '../helpers/get-entries';
import { Logger } from '../helpers/logger';
import { scopeOptions } from '../helpers/scope-options';
import { ensureArray } from '../utils/ensure-array';
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
  options = { ...options };
  // default to current directory
  options.dest = ensureArray(options.dest);
  if (options.dest.length === 0) {
    options.dest.push('.');
  }
  // run scopeOptions a second time (for cli)
  // then main options into inputs
  const entries = await getEntries(scopeOptions(options));
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
    const { unlink } = link.options;
    if (runner.checkLink(link, { message: message() }) && !watchOnly) {
      // linking src -> dest === copy src files to dest
      // unlinking src -> dest === remove src files from dest
      const files = await (unlink
        ? link.getSrcFilesFromDest()
        : link.src.files());
      await runner.run(unlink ? 'remove' : 'copy', { link, files });
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
  // get all links that are watchable
  const watchLinks =
    options.watch || watchOnly
      ? manager.links.filter(link => !link.options.unlink)
      : [];
  if (watchLinks.length > 0) {
    watcher = watch(watchLinks, runner);
    logger.log({ app: true }, 'Watching for package file changes.');
  }
  return lnpkg;
}
