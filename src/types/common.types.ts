import { Input, ScopedOptions } from '../core/lnpkg.types';

// NOTE: internal

export interface Entry {
  src: string;
  dest: string;
  options: ScopedOptions;
}

// same as Input but always string array for src and dest
export interface ScopedInput extends Omit<Input, 'src' | 'dest'> {
  src: string[];
  dest?: string[];
}
