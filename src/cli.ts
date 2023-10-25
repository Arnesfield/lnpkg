import { Command } from 'commander';
import { description, name, version } from '../package.json';
import { lnpkg } from './core/lnpkg';

interface ProgramOptions {
  target: string;
  watch?: boolean;
  watchAfter?: boolean;
}

function createProgram() {
  return new Command()
    .name(name)
    .description(description)
    .argument('[dirs...]', 'paths to local Node.js packages to link')
    .option('-t, --target <target>', 'target Node.js package to link', '.')
    .option('-w, --watch', 'watch package files for changes')
    .option(
      '-W, --watch-after',
      'watch package files for changes after linking packages'
    )
    .version(`v${version}`, '-v, --version');
}

export async function cli(): Promise<void> {
  const program = createProgram().parse();
  const { args } = program;
  if (args.length === 0) {
    program.help();
  }
  const programOpts = program.opts<ProgramOptions>();
  const paths = args.filter(arg => !arg.startsWith('-'));
  try {
    await lnpkg({
      paths,
      watch: programOpts.watch,
      watchAfter: programOpts.watchAfter,
      target: programOpts.target || process.cwd()
    });
  } catch (error) {
    console.error(error instanceof Error ? error.toString() : error);
  }
}
