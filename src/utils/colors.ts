import { ColorName } from 'chalk';

const COLORS = ['green', 'cyan', 'blue', 'magenta', 'red', 'yellow'] as const;

export function colors<T extends WeakKey>(): (value: T) => ColorName {
  let index = -1;
  const next = () => COLORS[++index >= COLORS.length ? (index = 0) : index];
  const colorMap = new WeakMap<T, ColorName>();
  return (value: T) => {
    const exists = colorMap.get(value);
    const color = exists || next();
    if (!exists) {
      colorMap.set(value, color);
    }
    return color;
  };
}
