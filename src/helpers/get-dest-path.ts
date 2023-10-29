import path from 'path';
import { Link } from '../link/link';

export function getDestPath(link: Link, ...paths: string[]): string {
  return path.resolve(
    link.dest.path,
    'node_modules',
    link.src.json.name,
    ...paths
  );
}
