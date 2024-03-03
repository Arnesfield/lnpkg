import path from 'path';

export function cwd(value?: string): string {
  return value ? path.resolve(value) : process.cwd();
}

export function absolute(value: string, ...paths: string[]): string {
  return path.isAbsolute(value) ? value : path.resolve(...paths, value);
}
