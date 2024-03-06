import { Command } from 'commander';
import { Input, LnPkgOptions } from '../core/lnpkg.types';
import { scopeOptions } from '../helpers/scope-options';
import { ensureArray } from '../utils/ensure-array';
import { cwd } from '../utils/path.utils';
import { ProgramOptions } from './command';
import { resolveConfigs } from './resolve-config';

export async function parseOptions(command: Command): Promise<LnPkgOptions> {
  const {
    config: _config,
    configs: _configs,
    dest: _dest,
    dests: _dests,
    link = [],
    ...opts
  } = command.opts<ProgramOptions>();
  // make sure inputs have sources
  for (const input of link) {
    if (input.dest.length === 0) {
      command.error(
        "error: missing option '-t, --to <paths...>' after option '-l, --link'"
      );
    }
  }
  // handle same reference from different option names
  const config = _config || _configs;
  // properly resolve and scope options
  // parse json config, use provided cwd to resolve config path
  const configs = Array.isArray(config) ? Array.from(new Set(config)) : [];
  const resolvedOptions = await resolveConfigs(cwd(opts.cwd), configs);
  // cli options take priority, everything else (configs) should get scoped
  const input = (command.args as (string | Input)[]).concat(link);
  for (const opts of resolvedOptions) {
    // scope and merge inputs (options -> inputs)
    input.push(...scopeOptions(opts));
  }
  // default to current directory
  const dest = ensureArray(_dest || _dests);
  if (dest.length === 0) {
    dest.push('.');
  }
  return { ...opts, input, dest };
}
