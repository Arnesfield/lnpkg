import chalk, { ChalkInstance } from 'chalk';

export function colors(): () => ChalkInstance {
  const colors = [
    chalk.green,
    chalk.cyan,
    chalk.blue,
    chalk.magenta,
    chalk.red,
    chalk.yellow
  ];
  let index = -1;
  return () => {
    if (++index >= colors.length) {
      index = 0;
    }
    return colors[index];
  };
}
