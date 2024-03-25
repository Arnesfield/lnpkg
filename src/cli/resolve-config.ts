import path from 'path';
import { LnPkgOptions } from '../core/lnpkg.types.js';
import { ensureArray } from '../utils/ensure-array.js';
import { readFile } from '../utils/fs.utils.js';
import { stdin } from '../utils/stdin.js';

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
  let json =
    config === '-'
      ? await stdin()
      : typeof config === 'string'
      ? await readFile(path.resolve(cwd, config))
      : undefined;
  // eslint-disable-next-line no-cond-assign
  const options: LnPkgOptions = (json &&= json.trim()) ? JSON.parse(json) : {};
  // in case options is not a valid object
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new Error('Unable to parse config.');
  }
  // ensure required properties
  options.input = ensureArray(options.input);
  return options;
}
