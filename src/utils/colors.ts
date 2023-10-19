const COLORS = ['green', 'cyan', 'blue', 'magenta', 'red', 'yellow'] as const;

export type Color = (typeof COLORS)[number];

export function colors(): () => Color {
  let index = -1;
  return () => COLORS[++index >= COLORS.length ? (index = 0) : index];
}
