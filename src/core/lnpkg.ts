import { Logger } from '../helpers/logger';
import { LnPkg, LnPkgOptions } from '../types/core.types';
import { LnPkgClass } from './lnpkg.class';

export function lnpkg(options: LnPkgOptions = {}): LnPkg {
  return new LnPkgClass(new Logger(), options);
}
