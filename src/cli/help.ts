import { helpText } from '../help-text.js';

export function help(): void {
  console.log(helpText());
  process.exit(0);
}
