import { helpText } from '../help-text.js';

export function help(): void {
  console.log(process.env.HELP || helpText());
  process.exit(0);
}
