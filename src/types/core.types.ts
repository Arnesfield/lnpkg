export interface Entry {
  src: string;
  dest: string;
}

export interface LnPkgOptions {
  paths: (string | Entry)[];
  target?: string;
  dryRun?: boolean;
  watch?: boolean;
  watchAfter?: boolean;
}
