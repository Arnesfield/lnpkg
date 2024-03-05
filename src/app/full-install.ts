import chalk from 'chalk';
import { exec, spawn } from 'child_process';
import { Stats } from 'fs';
import path from 'path';
import { promisify } from 'util';
import { name } from '../../package.json';
import { loadPartialDeps } from '../helpers/partial-deps';
import { lstat } from '../utils/fs.utils';

export async function fullInstall(
  flag: 'force' | 'check' | true
): Promise<void> {
  // check if installed
  const deps = await loadPartialDeps();
  const installed =
    deps['@npmcli/arborist'].module && deps['npm-packlist'].module;
  if (flag === 'force') {
    // do nothing
  } else if (flag === 'check') {
    console.log(installed ? 'full' : 'partial');
    return;
  } else if (flag && installed) {
    console.log(
      'Dependencies already installed. Run %s to force full install.',
      chalk.bgBlack.green('lnpkg --app-full-install force')
    );
    return;
  }

  const prefix = process.env.npm_config_prefix;
  const rootDir = prefix
    ? path.resolve(prefix, 'lib', 'node_modules')
    : (await promisify(exec)('npm root --global')).stdout.trim();
  if (!rootDir) {
    throw new Error('Cannot get npm global root directory.');
  }
  const globalPkgDir = path.resolve(rootDir, name);
  let stats: Stats;
  try {
    stats = await lstat(globalPkgDir);
  } catch {
    throw new Error(`${name} is not installed globally: ${globalPkgDir}`);
  }
  if (!stats.isDirectory()) {
    throw new Error(`Not a directory: ${globalPkgDir}`);
  }
  const dependencies = Object.values(deps).map(dep => dep.dependency);
  const args = 'install --omit dev optional --save-exact --save-peer';
  const npm = spawn('npm', args.split(' ').concat(dependencies), {
    stdio: 'inherit',
    cwd: globalPkgDir,
    env: { ...process.env }
  });
  await new Promise<void>((resolve, reject) => {
    npm.on('error', reject).on('close', code => {
      process.exitCode = code ?? 0;
      resolve();
    });
  });
}
