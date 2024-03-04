import { cliNotice } from './cli/cli-notice';
import { createCommand } from './cli/command';
import { parseOptions } from './cli/parse-options';
import { lnpkg } from './core/lnpkg';
import { errorLog } from './utils/error';

export async function cli(): Promise<void> {
  // if no args, show help
  const command = createCommand();
  if (process.argv.length < 3) {
    command.help();
  }
  try {
    const options = await parseOptions(command.parse());
    await cliNotice();
    await lnpkg(options);
  } catch (error) {
    console.error(errorLog(error));
    process.exitCode = 1;
  }
}
