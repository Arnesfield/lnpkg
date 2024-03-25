// NOTE: SHOULD NOT BE IMPORTED DIRECTLY. GENERATE HELP TEXT TO BE REPLACED IN BUILD.

import cliui from 'cliui';
import { createRequire } from 'module';
import type Pkg from '../package.json';

export function helpText(): string {
  const require = createRequire(import.meta.url);
  const pkg: typeof Pkg = require('../package.json');

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const ui = cliui({ width: 80 });

  ui.div(pkg.description);
  ui.div('Usage: $0 [command] [options]');

  ui.div({
    text: 'Options:',
    padding: [2, 0, 1, 0]
  });

  ui.div(
    {
      text: '-f, --file',
      width: 20,
      padding: [0, 4, 0, 4]
    },
    {
      text: 'the file to load.' + '(if this description is long it wraps).',
      width: 20,
      padding: []
    },
    {
      text: '[required]',
      align: 'right',
      padding: []
    }
  );

  return ui.toString();
}
