import { Command } from 'commander';
import { description, name, version } from '../../package.json';
import { parsePaths } from '../helpers/parse-paths';
import { main } from './main';

interface ProgramOptions {
  to: string;
  cwd?: string;
  dryRun?: boolean;
  force?: boolean;
  watch?: boolean;
  watchOnly?: boolean;
}

function createProgram() {
  return new Command()
    .name(name)
    .description(description)
    .argument(
      '[paths...]',
      'paths of source packages to link.\n' +
        'Separate with a colon to link specific source and destination packages:\n\n' +
        'lnpkg <src1> : <dest1> <src2> <src3> : <dest3> ...'
    )
    .option('-n, --dry-run', 'log only without performing operations (noop)')
    .option(
      '-t, --to <path>',
      'the default destination package to link source packages to',
      '.'
    )
    .option(
      '-C, --cwd <path>',
      'run command as if it was started in <path> instead of the current working directory'
    )
    .option(
      '-f, --force',
      'allow link even if source package is not a dependency of destination package'
    )
    .option(
      '-w, --watch',
      'watch package files for changes after linking packages'
    )
    .option(
      '-W, --watch-only',
      'skip linking packages and watch package files for changes only'
    )
    .version(`v${version}`, '-v, --version');
}

export async function cli(): Promise<void> {
  // if no args, show help
  const program = createProgram();
  if (process.argv.length <= 2) {
    program.help();
  }
  program.parse();
  try {
    const paths = parsePaths(program.args);
    if (paths.length === 0) {
      throw new Error("No 'paths' provided.");
    }
    const { to: dest, ...options } = program.opts<ProgramOptions>();
    await main(paths, { dest, ...options });
  } catch (error) {
    console.error(error instanceof Error ? error.toString() : error);
    process.exitCode = 1;
  }
}
