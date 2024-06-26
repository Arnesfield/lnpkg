import { Input, LnPkgOptions } from '../core/lnpkg.types.js';
import { ScopedInput } from '../types/common.types.js';
import { ensureArray } from '../utils/ensure-array.js';

/**
 * Scope options into {@linkcode ScopedInput ScopedInputs}.
 * @param options The options to scope.
 * @returns The scoped options as inputs.
 */
export function scopeOptions(options: LnPkgOptions): ScopedInput[] {
  const input = ensureArray(options.input).map(src => {
    const input = (
      typeof src === 'string' ? { src } : { ...src }
    ) as ScopedInput;
    input.src = ensureArray((input as Input).src);
    // set dest to input if not provided
    if ((input as Input).dest == null && options.dest != null) {
      input.dest = ensureArray(options.dest);
    }
    input.cwd ??= options.cwd;
    input.force ??= options.force;
    input.skip ??= options.skip;
    input.unlink ??= options.unlink;
    return input;
  });
  return input;
}
