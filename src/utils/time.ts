export class Time {
  private readonly timeMap: { [key: string]: number } = {};

  start(key: string): number {
    return (this.timeMap[key] = performance.now());
  }

  end(key: string): number {
    return performance.now() - (this.timeMap[key] ?? 0);
  }

  diff(key: string): string {
    const diff = this.end(key);
    return diff.toFixed(+(diff < 1));
  }
}
