import { ColorName } from 'chalk';
import { Package } from '../package/package';

const COLORS = ['green', 'cyan', 'blue', 'magenta', 'red', 'yellow'] as const;

export function colors(): (pkg: Package) => ColorName {
  let index = -1;
  const next = () => COLORS[++index >= COLORS.length ? (index = 0) : index];
  const colorMap = new WeakMap<Package, ColorName>();
  return (pkg: Package) => {
    const exists = colorMap.get(pkg);
    const color = exists || next();
    if (!exists) colorMap.set(pkg, color);
    return color;
  };
}
