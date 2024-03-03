export class Batch<K, V> {
  private readonly items: [K, V[]][] = [];

  add(key: K, ...data: V[]): void {
    const existing = this.items[this.items.length - 1];
    if (existing && existing[0] === key) {
      existing[1].push(...data);
    } else {
      this.items.push([key, data]);
    }
  }

  flush(): [K, V[]][] {
    // get items and clear items
    const items = this.items.slice();
    this.items.length = 0;
    return items;
  }
}
