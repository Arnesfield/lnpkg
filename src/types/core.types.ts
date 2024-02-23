export interface Entry {
  src: string;
  dest: string;
}

export interface LnPkgOptions {
  paths: (string | Entry)[];
  to?: string | string[];
  cwd?: string;
  dryRun?: boolean;
  ndeps?: boolean | null;
  watch?: boolean;
  watchOnly?: boolean;
}
