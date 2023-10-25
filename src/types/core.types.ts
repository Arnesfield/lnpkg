export interface Entry {
  src: string;
  dest: string;
}

export interface LnPkgOptions {
  paths: (string | Entry)[];
  target?: string;
  watch?: boolean;
  watchAfter?: boolean;
}
