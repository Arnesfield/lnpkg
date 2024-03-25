import { help } from './cli/help';
import { parseArgs } from './cli/parse-args';
import { parseOptions } from './cli/parse-options';
import { lnpkg } from './core/lnpkg';
import { errorLog } from './utils/error';

export async function cli(): Promise<void> {
  // if no args, show help
  if (process.argv.length < 3) {
    help();
  }
  try {
    await lnpkg(await parseOptions(parseArgs()));
  } catch (error) {
    console.error(errorLog(error));
    process.exitCode = 1;
  }
}
