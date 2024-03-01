import { Command } from 'commander';
import { LnPkgOptions } from '../core/lnpkg.types';
import { cwd } from '../utils/cwd';
import { ProgramOptions } from './command';
import { mergeOptions } from './merge-options';
import { resolveConfigs } from './resolve-config';
import { scopeOptions } from './scope-options';

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
  const dest = _dest || _dests;
  const config = _config || _configs;
  // properly resolve and scope options
  // parse json config, use provided cwd to resolve config path
  const configs = Array.isArray(config) ? Array.from(new Set(config)) : [];
  const resolvedOptions = await resolveConfigs(cwd(opts.cwd), configs);
  const scopedOptions = scopeOptions(resolvedOptions);
  // merge options, prioritize cli options
  const input = command.processedArgs[0].concat(link);
  const options = mergeOptions({ ...opts, input, dest }, ...scopedOptions);
  // default to current directory
  if (!options.dest || options.dest.length === 0) {
    options.dest = ['.'];
  }
  return options;
}
