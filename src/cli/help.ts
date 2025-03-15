import { helpText } from '../help-text.js';

export function help(): never {
  console.log(process.env.HELP || helpText());
  process.exit();
}
