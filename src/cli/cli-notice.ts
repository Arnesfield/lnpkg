import chalk from 'chalk';
import { Logger, PrefixOptions } from '../helpers/logger';
import { try2do } from '../utils/try2do';
import { fullInstallDeps } from './full-install';

export async function cliNotice(): Promise<void> {
  const hasDeps = await try2do(async () => {
    await import('@npmcli/arborist');
    await import('npm-packlist');
    return true;
  });
  if (hasDeps) {
    return;
  }
  const prefix: PrefixOptions = { app: true, notice: true };
  const logger = new Logger();
  logger
    .log(prefix)
    .log(prefix, 'Partial install detected.')
    .log(
      prefix,
      'Using',
      chalk.bgBlack.yellow('npm pack'),
      'for loading package files.'
    )
    .log(prefix)
    .log(
      prefix,
      'Run',
      chalk.bgBlack.green('lnpkg --full-install'),
      'once if you wish'
    )
    .log(prefix, 'to install the following dependencies:')
    .log(prefix);
  for (const dep of fullInstallDeps) {
    logger.log(prefix, chalk.bgBlack(chalk.green('+') + dep));
  }
  logger.log(prefix);
}
