import fs from 'fs';
import path from 'path';
import { LnPkgOptions } from '../types/core.types';
import { ensureArray } from '../utils/ensure-array';
import { getStdin } from '../utils/stdin';

export async function resolveConfigs(
  cwd: string,
  configs: string[]
): Promise<LnPkgOptions[]> {
  // NOTE: assume filtered
  const options: LnPkgOptions[] = [];
  for (const config of configs) {
    options.push(await resolveConfig(cwd, config));
  }
  return options;
}

async function resolveConfig(cwd: string, config: string) {
  const buffer =
    config === '-'
      ? await getStdin()
      : typeof config === 'string'
      ? await fs.promises.readFile(path.resolve(cwd, config))
      : undefined;
  const options: LnPkgOptions = buffer ? JSON.parse(buffer.toString()) : {};
  // in case options is not a valid object
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new Error('Unable to parse config.');
  }
  options.input = ensureArray(options.input);
  return options;
}
