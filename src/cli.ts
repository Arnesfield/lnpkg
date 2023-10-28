import { Command } from 'commander';
import { description, name, version } from '../package.json';
import { lnpkg } from './core/lnpkg';
import { parsePaths } from './helpers/parse-paths';

interface ProgramOptions {
  target: string;
  dryRun?: boolean;
  watch?: boolean;
  watchAfter?: boolean;
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
    .option('-t, --target <target>', 'target Node.js package to link', '.')
    .option('-w, --watch', 'watch package files for changes')
    .option(
      '-W, --watch-after',
      'watch package files for changes after linking packages'
    )
    .option('--dry-run', 'log only without performing operations')
    .version(`v${version}`, '-v, --version');
}

export async function cli(): Promise<void> {
  const program = createProgram().parse();
  const { args } = program;
  if (args.length === 0) {
    program.help();
  }
  const opts = program.opts<ProgramOptions>();
  try {
    await lnpkg({
      ...opts,
      paths: parsePaths(args),
      target: opts.target || process.cwd()
    });
  } catch (error) {
    console.error(error instanceof Error ? error.toString() : error);
  }
}
