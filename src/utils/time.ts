export class Time {
  private readonly timeMap: { [key: string]: number } = {};

  start(key: string): number {
    return (this.timeMap[key] = performance.now());
  }

  end(key: string): number {
    return performance.now() - (this.timeMap[key] ?? 0);
  }

  clear(key: string): void {
    delete this.timeMap[key];
  }

  diff(key: string, keep = false): string {
    const diff = this.end(key);
    if (!keep) this.clear(key);
    return parseFloat(diff.toFixed(+(diff < 1))) + 'ms';
  }
}
