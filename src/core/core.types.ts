export interface PathMap {
  src: string;
  dest: string;
}

export interface LnPkgOptions {
  paths?: string[] | PathMap[];
  target?: string;
  clean?: boolean;
}
