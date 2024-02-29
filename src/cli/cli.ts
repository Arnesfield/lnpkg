import { lnpkg } from '../core/lnpkg';
import { createCommand } from './command';
import { parseOptions } from './options';

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
