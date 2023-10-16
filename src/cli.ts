import { Command } from 'commander';
import { description, name, version } from '../package.json';
import { lnpkg } from './core/lnpkg';

interface ProgramOptions {
  target: string;
  clean: boolean;
}

function createProgram() {
  return new Command()
    .name(name)
    .description(description)
    .argument('[dirs...]', 'paths to local Node.js packages to link')
    .option('-t, --target <target>', 'target Node.js package to link', '.')
    .option(
      '--clean',
      'delete files from <target> based on <dirs> files',
      false
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
  await lnpkg({
    paths,
    clean: programOpts.clean,
    target: programOpts.target || process.cwd()
  });
}