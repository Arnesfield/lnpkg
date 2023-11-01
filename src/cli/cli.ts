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
      '[dirs...]',
      'paths to local Node.js packages to link.\n' +
        'Separate with a colon to map specific packages:\n\n' +
        'lnpkg <src1> : <dest1> <src2> <src3> : <dest3> ...'
    )
    .option('-n, --dry-run', 'log only without performing operations (noop)')
    .option('-t, --to <dest>', 'the Node.js package to link', '.')
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
  const program = createProgram().parse();
  const { args } = program;
  if (args.length === 0) {
    program.help();
  }
  const { to: dest, ...options } = program.opts<ProgramOptions>();
  try {
    await main(parsePaths(args), { dest, ...options });
  } catch (error) {
    console.error(error instanceof Error ? error.toString() : error);
    process.exitCode = 1;
  }
}
