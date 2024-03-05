import { peerDependencies } from '../../package.json';
import { try2do } from '../utils/try2do';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function loadPartialDeps() {
  const arborist = '@npmcli/arborist';
  const packlist = 'npm-packlist';
  return {
    [arborist]: {
      name: arborist,
      version: peerDependencies[arborist],
      dependency: `${arborist}@${peerDependencies[arborist]}`,
      module: await try2do(() => import('@npmcli/arborist'))
    },
    [packlist]: {
      name: packlist,
      version: peerDependencies[packlist],
      dependency: `${packlist}@${peerDependencies[packlist]}`,
      module: await try2do(() => import('npm-packlist'))
    }
  };
}
