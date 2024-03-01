import { LnPkgOptions } from '../core/lnpkg.types';
import { ensureArray } from '../utils/ensure-array';

/**
 * Scope options and remove fallback {@linkcode LnPkgOptions.dest dest} property.
 * @param options The options to scope.
 * @returns The scoped options.
 */
export function scopeOptions(options: LnPkgOptions[]): LnPkgOptions[] {
  return options.map(opts => {
    opts = { ...opts };
    opts.input = ensureArray(opts.input).map(src => {
      const input = typeof src === 'string' ? { src } : src;
      // set dest to input if not provided
      if (input.dest == null && opts.dest != null) {
        input.dest = opts.dest;
      }
      return input;
    });
    delete opts.dest;
    return opts;
  });
}
