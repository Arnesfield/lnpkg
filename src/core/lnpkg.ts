import { LnPkg, LnPkgOptions } from '../types/core.types';
import { createInstance } from './instance';

export function lnpkg(options: LnPkgOptions = {}): LnPkg {
  return createInstance(options).instance.lnpkg;
}
