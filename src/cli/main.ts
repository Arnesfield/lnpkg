import chalk from 'chalk';
import { createInstance } from '../core/instance';
import { MainOptions } from '../types/cli.types';
import { Entry, LnPkg } from '../types/core.types';
import { Time } from '../utils/time';

export async function main(
  paths: (string | Entry)[],
  options: MainOptions = {}
): Promise<LnPkg> {
  const { instance, logger } = createInstance(options);
  const time = new Time();

  time.start('links');
  const links = await instance.add(paths);
  const count = instance.lnpkg.count();
  logger.log(
    { app: true, message: 'Loaded %o packages, %o %s:' },
    count.packages,
    count.links,
    count.links === 1 ? 'link' : 'links',
    chalk.yellow(time.diff('links'))
  );

  if (options.watchOnly) {
    instance.check(links);
  } else {
    time.start('main');
    await instance.link(links);
    logger.log({ app: true }, 'Done:', chalk.yellow(time.diff('main')));
  }

  if (options.watch || options.watchOnly) {
    instance.watch();
    logger.log({ app: true }, 'Watching for package file changes.');
  }
  return instance.lnpkg;
}
