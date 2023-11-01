export interface Entry {
  src: string;
  dest: string;
}

export interface LnPkg {
  count(): { links: number; packages: number };
  add(paths: string | Entry | (string | Entry)[]): Promise<void>;
  link(paths: string | Entry | (string | Entry)[]): Promise<void>;
  watch(): { close(): Promise<void> };
}

export interface LnPkgOptions {
  cwd?: string;
  dest?: string;
  dryRun?: boolean;
  force?: boolean;
}
