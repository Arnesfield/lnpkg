import { createCommand } from './cli/command';
import { parseOptions } from './cli/parse-options';
import { lnpkg } from './core/lnpkg';

export async function cli(): Promise<void> {
  // if no args, show help
  const command = createCommand();
  if (process.argv.length < 3) {
    command.help();
  }
  try {
    await lnpkg(await parseOptions(command.parse()));
  } catch (error) {
    console.error(error instanceof Error ? error.toString() : error);
    process.exitCode = 1;
  }
}
