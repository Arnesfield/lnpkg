import { PackageJson } from '@npmcli/package-json';

export function hasDependency(json: PackageJson, name: string): boolean {
  return (
    [
      json.dependencies,
      json.devDependencies,
      json.peerDependencies,
      json.optionalDependencies
    ].some(deps => deps && Object.prototype.hasOwnProperty.call(deps, name)) ||
    (Array.isArray(json.bundleDependencies) &&
      json.bundleDependencies.includes(name)) ||
    (Array.isArray(json.bundledDependencies) &&
      json.bundledDependencies.includes(name))
  );
}
