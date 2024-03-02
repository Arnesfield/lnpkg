import { PackageJson } from '@npmcli/package-json';
import fs from 'fs';

export async function readPackage(pkgJsonPath: string): Promise<PackageJson> {
  try {
    const pkgJson = await fs.promises.readFile(pkgJsonPath);
    const pkg: PackageJson = JSON.parse(pkgJson.toString());
    return pkg;
  } catch {
    throw new Error(`Cannot parse JSON file: ${pkgJsonPath}`);
  }
}
