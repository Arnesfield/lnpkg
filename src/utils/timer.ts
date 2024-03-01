import prettyMilliseconds from 'pretty-ms';

export class Timer {
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
    if (!keep) {
      this.clear(key);
    }
    // show decimals for values less than a millisecond
    return diff < 1
      ? parseFloat(diff.toFixed(1)) + 'ms'
      : prettyMilliseconds(diff);
  }
}
