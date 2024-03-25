import { Input, LnPkgOptions } from '../core/lnpkg.types';
import { scopeOptions } from '../helpers/scope-options';
import { cwd } from '../utils/path.utils';
import { ProgramOptions } from './parse-args';
import { resolveConfigs } from './resolve-config';

export async function parseOptions(
  opts: ProgramOptions
): Promise<LnPkgOptions> {
  // properly resolve and scope options
  // parse json config, use provided cwd to resolve config path
  const configs = Array.isArray(opts.config)
    ? Array.from(new Set(opts.config))
    : [];
  const resolvedOptions = await resolveConfigs(cwd(opts.cwd), configs);
  // cli options take priority, everything else (configs) should get scoped
  const input = opts.input.slice() as (string | Input)[];
  const options = { ...opts, input } satisfies LnPkgOptions;
  for (const opts of resolvedOptions) {
    // scope and merge inputs (options -> inputs)
    options.input.push(...scopeOptions(opts));
    options.dryRun ??= opts.dryRun;
    options.watch ??= opts.watch;
    options.watchOnly ??= opts.watchOnly;
    options.quiet ??= opts.quiet;
    options.logLevel ??= opts.logLevel;
  }
  return options;
}
