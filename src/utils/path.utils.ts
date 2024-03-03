import path from 'path';

export function cwd(value?: string): string {
  return value ? path.resolve(value) : process.cwd();
}
