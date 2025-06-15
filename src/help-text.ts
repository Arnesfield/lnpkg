// NOTE: GENERATE HELP TEXT TO BE REPLACED IN BUILD.
// import package.json directly since this file
// is imported in rollup.config.ts which also imports package.json

import cliui from '@isaacs/cliui';
import PKG from '../package.json' with { type: 'json' };

export function helpText(): string {
  const opts = [
    {
      option: '-d, --dests <paths...>',
      description:
        "default destination package(s) to link source packages to (default: '.')"
    },
    {
      option: '--dest <path>',
      description: "similar to '--dests' but accepts one value at a time"
    },
    {
      option: '-l, --link <paths...>',
      description:
        "source packages to link to proceeding '--to' destination packages"
    },
    {
      option: '-t, --to <paths...>',
      description: "destination packages for preceding '--link' source packages"
    },
    {
      option: '-C, --cwd <path>',
      description:
        'run command as if it was started in <path> instead of the current working directory'
    },
    {
      option: '-c, --configs <paths...>',
      description: "file path to config(s) or '-' for stdin (json format)"
    },
    {
      option: '--config <path>',
      description: "similar to '--configs' but accepts one value at a time"
    },
    //
    {
      option: '-n, --dry-run',
      description: 'log only without performing operations (noop)'
    },
    {
      option: '-f, --force',
      description:
        'allow un/link even if source package is not a dependency of destination package'
    },
    {
      option: '-s, --skip',
      description:
        'skip un/link if source package is not a dependency of destination package'
    },
    {
      option: '-u, --unlink',
      description:
        'unlink source packages from destination packages (package files only) and skip linking them in watch mode'
    },
    {
      option: '-w, --watch',
      description: 'watch package files for changes after linking packages'
    },
    {
      option: '-W, --watch-only',
      description:
        'skip linking packages and watch package files for changes only'
    },
    //
    { option: '-q, --quiet', description: "set '--log-level' to 'error'" },
    {
      option: '--log-level <level>',
      description:
        "output logs only of equal or higher level ('info', 'warn', 'error', default: 'info')"
    },
    { option: '-v, --version', description: 'display version information' },
    { option: '-h, --help', description: 'display this help text' }
  ];

  const next = (() => {
    function* generator() {
      let count: number = yield null;
      let index = 0;
      while (true) {
        const chunks = [];
        while (chunks.length < count) {
          chunks.push(opts[index]);
          if (++index >= opts.length) {
            index = 0;
          }
        }
        count = yield chunks;
      }
    }
    // first yield does not count (null)
    const n = generator();
    return (count: number) => n.next(count).value || n.next(count).value || [];
  })();

  const optionsMaxWidth = 28;
  const ui = cliui({ width: 80 });

  function renderOption(option: string, description: string) {
    // for every option that exceeds max column size,
    // separate description into another line
    const longPadding = option.startsWith('--') ? 4 : 0;
    const padding = [0, 2, 0, 2 + longPadding];
    const width = padding.reduce((total, pad) => total + pad, option.length);
    if (width > optionsMaxWidth) {
      ui.div({ text: option, width, padding });
      ui.div({ text: description, padding: [0, 0, 0, optionsMaxWidth] });
    } else {
      ui.div(
        { text: option, width: optionsMaxWidth, padding },
        { text: description, padding: [] }
      );
    }
  }

  // description
  ui.div(PKG.description);

  // usages
  const usageText = 'Usage:';
  const usageWidth = usageText.length + 1;
  const usages = [
    '[-n|--dry-run] [src...] [options] [--] [src...]',
    '<src...> -d|--dests <dest...>',
    '<src...> --dest <dest1> [--dest <dest2>]',
    '-l|--link <src1...> -t|--to <dest1...> [-l <src2...> -t <dest2...>]',
    '-C|--cwd <path> ...',
    "-c|--configs <[*.json...] [-] [*.json...]> # stdin '-' json format",
    '--config <config1.json> [--config - --config <config3.json>]'
  ].map(usage => `${PKG.name} ${usage}`);
  ui.div();
  usages.forEach((usage, index) => {
    ui.div(
      { text: index === 0 ? usageText : '', width: usageWidth, padding: [] },
      { text: usage, padding: [] }
    );
  });

  // arguments
  ui.div();
  ui.div('Arguments');
  renderOption(
    '[src...]',
    'paths of source packages to link to destination packages ' +
      "(required only when '--link' and '--to' options are not used)"
  );

  // options
  ui.div();
  ui.div('Link package options');
  for (const o of next(7)) {
    renderOption(o.option, o.description);
  }
  ui.div();
  ui.div("Flags (use '--<flag>=0' or '--no-<flag>' to set to false)");
  for (const o of next(6)) {
    renderOption(o.option, o.description);
  }
  ui.div();
  ui.div('Output options');
  for (const o of next(4)) {
    renderOption(o.option, o.description);
  }

  return ui.toString();
}
