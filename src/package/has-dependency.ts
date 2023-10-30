import { PackageJson } from '../types/package.types';

export function hasDependency(json: PackageJson, name: string): boolean {
  return !!(
    json.dependencies?.[name] ||
    json.devDependencies?.[name] ||
    json.peerDependencies?.[name] ||
    json.optionalDependencies?.[name] ||
    (Array.isArray(json.bundleDependencies) &&
      json.bundleDependencies.includes(name)) ||
    (Array.isArray(json.bundledDependencies) &&
      json.bundledDependencies.includes(name))
  );
}
