import { Logger } from '../helpers/logger';
import { LnPkgOptions } from '../types/core.types';
import { LnPkgClass } from './lnpkg.class';

export function createInstance(options: LnPkgOptions): {
  instance: LnPkgClass;
  logger: Logger;
} {
  const logger = new Logger();
  return { instance: new LnPkgClass(logger, options), logger };
}
