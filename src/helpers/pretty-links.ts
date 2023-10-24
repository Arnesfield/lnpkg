import chalk from 'chalk';
import { PackageLink } from '../link/link';
import { colors } from '../utils/colors';

export function prettyLinks(): (link: PackageLink) => string[] {
  const color = colors();
  return (link: PackageLink) => {
    const srcName = chalk[color(link.src)].bold(link.src.json.name);
    const destName = chalk[color(link.dest)].bold(link.dest.json.name);
    return ['%s %s %s:', srcName, chalk.red('→'), destName];
  };
}
