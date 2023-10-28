export interface QueueOptions<T> {
  /** @default null */
  delay?: number | null;
  normalize?(items: T[]): T[];
  handle(item: T): void | Promise<void>;
}

export class Queue<T> {
  private readonly items: T[] = [];
  private collection: T[] | null = null;

  constructor(protected readonly options: QueueOptions<T>) {}

  enqueue(item: T): void {
    const exists = !!this.collection;
    if (!this.collection) {
      this.collection = [];
    }
    this.collection.push(item);
    if (exists) {
      return;
    }
    const save = () => {
      if (!this.collection) {
        return;
      }
      const items =
        typeof this.options.normalize === 'function'
          ? this.options.normalize(this.collection)
          : this.collection;
      // clear to make way for next collection
      this.collection = null;
      this.run(items);
    };
    if (typeof this.options.delay === 'number') {
      setTimeout(save, this.options.delay);
    } else {
      save();
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
      await this.options.handle(item);
    }
    // clear collections
    this.items.length = 0;
  }
}
