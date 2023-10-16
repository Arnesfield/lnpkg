import fs from 'fs';
import { PackageJson } from '../types/package.types';

export async function readPackage(pkgJsonPath: string): Promise<PackageJson> {
  try {
    const pkgJson = await fs.promises.readFile(pkgJsonPath);
    const pkg: PackageJson = JSON.parse(pkgJson.toString());
    return pkg;
  } catch {
    throw new Error(`${pkgJsonPath}: cannot parse json file`);
  }
}
