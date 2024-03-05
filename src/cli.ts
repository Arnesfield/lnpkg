import { createCommand } from './cli/command';
import { parseOptions } from './cli/parse-options';
import { preparseOptions } from './cli/preparse-options';
import { showHelp } from './cli/show-help';
import { lnpkg } from './core/lnpkg';
import { errorLog } from './utils/error';

export async function cli(): Promise<void> {
  // if no args, show help
  const command = createCommand();
  if (process.argv.length < 3) {
    await showHelp(command);
  }
  try {
    // if parsed, stop lnpkg
    if (await preparseOptions(command.parse())) {
      return;
    }
    await lnpkg(await parseOptions(command));
  } catch (error) {
    console.error(errorLog(error));
    process.exitCode = 1;
  }
}
