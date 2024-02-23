export interface Entry {
  src: string;
  dest: string;
}

export interface LnPkgOptions {
  paths: (string | Entry)[];
  to?: string[];
  cwd?: string;
  dryRun?: boolean;
  force?: boolean;
  watch?: boolean;
  watchOnly?: boolean;
}
