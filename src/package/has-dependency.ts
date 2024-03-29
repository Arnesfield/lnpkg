import { PackageJson } from '@npmcli/package-json';

export function hasDependency(json: PackageJson, name: string): boolean {
  // NOTE: expect that __proto__ is never used anyway
  // bypass check with force flag
  return !!(
    name !== '__proto__' &&
    (json.dependencies?.[name] ||
      json.devDependencies?.[name] ||
      json.peerDependencies?.[name] ||
      json.optionalDependencies?.[name] ||
      (Array.isArray(json.bundleDependencies) &&
        json.bundleDependencies.includes(name)) ||
      (Array.isArray(json.bundledDependencies) &&
        json.bundledDependencies.includes(name)))
  );
}
