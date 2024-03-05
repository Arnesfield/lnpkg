export class Queue<T> {
  private readonly items: T[] = [];
  private collection: T[] | null = null;

  constructor(protected readonly handler: (item: T) => void | Promise<void>) {}

  add(...items: T[]): void {
    const exists = !!this.collection;
    (this.collection ||= []).push(...items);
    if (exists) {
      return;
    }
    const collection = this.collection;
    if (collection) {
      // clear to make way for next collection
      this.collection = null;
      this.run(collection);
    }
  }

  private async run(items: T[]) {
    const isRunning = this.items.length > 0;
    this.items.push(...items);
    if (isRunning) {
      return;
    }
    for (const item of this.items) {
      // NOTE: assume error handling in callback
      await this.handler(item);
    }
    // clear items after processing
    this.items.length = 0;
  }
}
