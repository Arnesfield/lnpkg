import chalk from 'chalk';
import { Command } from 'commander';
import { name } from '../../package.json';
import { loadPartialDeps } from '../helpers/partial-deps';

export async function showHelp(command: Command): Promise<void> {
  const deps = await loadPartialDeps();
  const installed =
    deps['@npmcli/arborist'].module && deps['npm-packlist'].module;
  if (Object.values(deps).some(dep => !dep.module)) {
    const depsLog = Object.values(deps)
      .map(dep => {
        const icon = dep.module ? '\u2714' : '\u2718';
        return `[${icon}] ${dep.dependency}`;
      })
      .join(' ');

    command
      .addHelpText(
        'after',
        '\nPartial installation detected. Using ' +
          chalk.bold('npm pack') +
          ` for loading package files.\n${depsLog}\n`
      )
      .addHelpText(
        'after',
        'Run ' +
          chalk.bold(`${name} --app-full-install`) +
          ' to install dependencies.'
      );
  }

  command.addHelpText(
    'after',
    (installed ? '\n' : '') +
      'Run ' +
      chalk.bold(`${name} --app-update`) +
      ' to update package version.'
  );
  command.help();
}
