import { LnPkgOptions } from './core.types';

export interface MainOptions extends LnPkgOptions {
  watch?: boolean;
  watchOnly?: boolean;
}
