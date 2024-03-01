import { LnPkgOptions } from '../core/lnpkg.types';
import { ensureArray } from '../utils/ensure-array';

export function mergeOptions(
  opts: LnPkgOptions,
  ...allOptions: LnPkgOptions[]
): LnPkgOptions {
  // mutate main opts here
  opts.dest = ensureArray(opts.dest);
  opts.input = ensureArray(opts.input);
  // merge options, prioritize opts over other options
  for (const options of allOptions) {
    opts.cwd ??= options.cwd;
    opts.dryRun ??= options.dryRun;
    opts.force ??= options.force;
    opts.skip ??= options.skip;
    opts.watch ??= options.watch;
    opts.watchOnly ??= options.watchOnly;
    opts.dest.push(...ensureArray(options.dest));
    opts.input.push(...ensureArray(options.input));
  }
  return opts;
}
