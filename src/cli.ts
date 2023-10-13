import { spawn } from 'child_process';
import { Command } from 'commander';
import { description, name, version } from '../package.json';
import { lnpkg, LnPkgOptions } from './core/lnpkg';

interface ProgramOptions {
  target: string;
  clean: boolean;
  install: boolean;
}

function createProgram() {
  return new Command()
    .name(name)
    .description(description)
    .argument('[dirs...]', 'paths to local Node.js packages to link')
    .option('-t, --target <target>', 'target Node.js package to link', '.')
    .option('-c, --clean', 'delete linked files from node_modules', false)
    .option(
      '-i, --install',
      'runs `npm install --install-links <args...>` before linking.\n' +
        'Use `lnpkg --install [dirs...] -- [args...]` to include' +
        'additional arguments for `npm`.',
      false
    )
    .version(`v${version}`, '-v, --version');
}

export async function cli(): Promise<void> {
  const program = createProgram().parse();
  const args = program.args;
  if (args.length === 0) {
    program.help();
  }

  const programOpts = program.opts<ProgramOptions>();
  const dirs = args.filter(arg => !arg.startsWith('-'));
  const options: LnPkgOptions = {
    target: programOpts.target || process.cwd(),
    clean: programOpts.clean
  };

  if (!programOpts.install) {
    await lnpkg(dirs, options);
    return;
  }

  let error: Error | undefined;
  const npmArgs = ['install', '--install-links', ...args];
  console.log('$ npm', ...npmArgs);
  const npm = spawn('npm', npmArgs, { stdio: 'inherit' });
  npm.on('error', err => (error = err));

  await new Promise<void>((resolve, reject) => {
    npm.on('close', async code => {
      if (code !== null && code !== 0) {
        process.exitCode = code;
        return reject(error);
      }
      try {
        await lnpkg(dirs, options);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}
