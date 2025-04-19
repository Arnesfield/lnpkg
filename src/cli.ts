import { help } from './cli/help.js';
import { parseArgs } from './cli/parse-args.js';
import { parseOptions } from './cli/parse-options.js';
import { lnpkg } from './core/lnpkg.js';
import { errorLog } from './utils/error.js';

// show help if no args
if (process.argv.length < 3) help();

(async function () {
  try {
    await lnpkg(await parseOptions(parseArgs(process.argv.slice(2))));
  } catch (error) {
    console.error(errorLog(error));
    process.exitCode = 1;
  }
})();
