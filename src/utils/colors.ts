const COLORS = ['green', 'cyan', 'blue', 'magenta', 'red', 'yellow'] as const;

export function colors(): () => (typeof COLORS)[number] {
  let index = -1;
  return () => COLORS[++index >= COLORS.length ? (index = 0) : index];
}
