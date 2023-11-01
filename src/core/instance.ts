import { Logger } from '../helpers/logger';
import { LnPkg, LnPkgOptions } from '../types/core.types';
import { LnPkgClass } from './lnpkg.class';

export function createInstance(options: LnPkgOptions): {
  lnpkg: LnPkg;
  logger: Logger;
} {
  const logger = new Logger();
  const lnpkg = new LnPkgClass(logger, options);
  return { lnpkg, logger };
}
