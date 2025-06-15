import chalk from 'chalk';
import { getEntries } from '../helpers/get-entries.js';
import { Logger } from '../helpers/logger.js';
import { scopeOptions } from '../helpers/scope-options.js';
import { ensureArray } from '../utils/ensure-array.js';
import { errorLog } from '../utils/error.js';
import { pluralize } from '../utils/pluralize.js';
import { Timer } from '../utils/timer.js';
import { Link } from './link.js';
import { LnPkgOptions } from './lnpkg.types.js';
import { Manager } from './manager.js';
import { Runner } from './runner.js';
import { watch } from './watch.js';

/**
 * Link local Node.js packages.
 * @param options Link package options.
 */
export async function lnpkg(options: LnPkgOptions): Promise<void> {
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

  const logger = new Logger(options);
  const manager = new Manager();
  const runner = new Runner(logger, options);
  const timer = new Timer();
  const { watchOnly } = options;
  const watchChanges = options.watch || watchOnly;

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
    const { force, unlink } = link.options;
    if (runner.checkLink(link, { message: message() }) && !watchOnly) {
      // linking src -> dest === copy src files to dest
      // unlinking src -> dest === remove src files from dest
      const files = await (unlink
        ? link.getSrcFilesFromDest()
        : link.src.files());
      await runner.run(unlink ? 'remove' : 'copy', { link, files });
    } else if (watchChanges && (force || link.isDependency())) {
      // if watching for changes, make sure to preload files
      await link.src.files();
    }
  }

  const s1 = manager.stats();
  const s2 = logger.stats;

  logger.log(
    { app: true, message: 'Found %o %s, %o %s (%o %s, %o %s) in' },
    s1.packages,
    pluralize('package', s1.packages),
    s1.links,
    pluralize('link', s1.links),
    s2.errors,
    pluralize('error', s2.errors),
    s2.warnings,
    pluralize('warning', s2.warnings),
    chalk.yellow(timer.diff('main'))
  );

  // watch only if links are available
  // get all links that are watchable
  const watchLinks = watchChanges
    ? manager.links.filter(link => {
        return (
          !link.options.unlink && (link.options.force || link.isDependency())
        );
      })
    : [];
  if (watchLinks.length > 0) {
    // ignore watcher?
    watch(watchLinks, runner);
    logger.log({ app: true }, 'Watching for package file changes.');
  }
}
