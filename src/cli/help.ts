import { helpText } from '../help-text.js';

// boolean return to trick validate expected return value
export function help(): boolean {
  console.log(process.env.HELP || helpText());
  process.exit(0);
}
