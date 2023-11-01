import chalk from 'chalk';
import { createInstance } from '../core/instance';
import { MainOptions } from '../types/cli.types';
import { Entry, LnPkg } from '../types/core.types';
import { Time } from '../utils/time';

export async function main(
  paths: (string | Entry)[],
  options: MainOptions = {}
): Promise<LnPkg> {
  const { lnpkg, logger } = createInstance(options);
  const time = new Time();

  time.start('links');
  await lnpkg.add(paths);
  const count = lnpkg.count();
  logger.log(
    { app: true, message: 'Loaded %o packages, %o %s:' },
    count.packages,
    count.links,
    count.links === 1 ? 'link' : 'links',
    chalk.yellow(time.diff('links'))
  );

  const { watchOnly } = options;
  if (!watchOnly) {
    time.start('main');
  }
  await lnpkg.link(paths, watchOnly);
  if (!watchOnly) {
    logger.log({ app: true }, 'Done:', chalk.yellow(time.diff('main')));
  }

  if (options.watch || watchOnly) {
    lnpkg.watch();
    logger.log({ app: true }, 'Watching for package file changes.');
  }
  return lnpkg;
}
