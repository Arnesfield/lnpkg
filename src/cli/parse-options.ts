import { Input, LnPkgOptions } from '../core/lnpkg.types.js';
import { scopeOptions } from '../helpers/scope-options.js';
import { cwd } from '../utils/path.utils.js';
import { ParsedArgs } from './parse-args.js';
import { resolveConfigs } from './resolve-config.js';

export async function parseOptions(args: ParsedArgs): Promise<LnPkgOptions> {
  // properly resolve and scope options
  // parse json config, use provided cwd to resolve config path
  const configs = Array.isArray(args.config)
    ? Array.from(new Set(args.config))
    : [];
  const resolvedOptions = await resolveConfigs(cwd(args.cwd), configs);
  // cli options take priority, everything else (configs) should get scoped
  const input = args.input.slice() as (string | Input)[];
  const options = { ...args, input } satisfies LnPkgOptions;
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
