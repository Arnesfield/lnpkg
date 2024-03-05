import { spawn } from 'child_process';
import { name } from '../../package.json';
import { loadPartialDeps } from '../helpers/partial-deps';
import { fullInstall } from './full-install';

export async function update(): Promise<void> {
  // TODO: currently using hacky update to install and handle full install
  const deps = await loadPartialDeps();
  const installed =
    deps['@npmcli/arborist'].module && deps['npm-packlist'].module;
  const args = `install --global ${name}`;
  const npm = spawn('npm', args.split(' '), {
    stdio: 'inherit',
    env: { ...process.env }
  });
  await new Promise<void>((resolve, reject) => {
    npm.on('error', reject).on('close', async code => {
      process.exitCode = code ?? 0;
      if (installed) {
        await fullInstall('force');
      }
      resolve();
    });
  });
}
