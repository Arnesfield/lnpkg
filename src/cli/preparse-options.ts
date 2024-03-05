import { Command } from 'commander';
import { fullInstall } from '../app/full-install';
import { update } from '../app/update';
import { ProgramOptions } from './command';
import { showHelp } from './show-help';

export async function preparseOptions(command: Command): Promise<boolean> {
  const { help, appFullInstall, appUpdate } = command.opts<ProgramOptions>();
  if (help) {
    await showHelp(command);
  } else if (appFullInstall) {
    await fullInstall(appFullInstall);
  } else if (appUpdate) {
    await update();
  } else {
    return false;
  }
  return true;
}
