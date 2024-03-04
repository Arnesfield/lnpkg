import { devDependencies } from '../../package.json';

export const fullInstallDeps = (
  ['@npmcli/arborist', 'npm-packlist'] as const
).map(name => name + '@' + devDependencies[name]);

export function fullInstall() {
  // TODO: go to install directory
  // TODO: run npm install for install deps
}
