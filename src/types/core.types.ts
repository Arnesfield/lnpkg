export interface Input {
  src: string | string[];
  dest?: string | string[];
}

export interface LnPkgOptions {
  input: string | Input | (string | Input)[];
  dest?: string | string[];
  cwd?: string;
  dryRun?: boolean;
  force?: boolean;
  skip?: boolean;
  watch?: boolean;
  watchOnly?: boolean;
}
