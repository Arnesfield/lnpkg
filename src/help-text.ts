// NOTE: GENERATE HELP TEXT TO BE REPLACED IN BUILD.
// for some reason, json plugin does not work for this
// so import package.json directly

import wrapAnsi from 'wrap-ansi';
import PKG from '../package.json' with { type: 'json' };

const columns = 80;
const optionsCols = 28;
const descCols = columns - optionsCols;
const newLineWhen = 1;

function renderOption(option: string, description?: string) {
  const spaceLength = option.startsWith('--') ? 6 : 2;
  option = ' '.repeat(spaceLength) + option;

  const longOption = option.length > optionsCols - newLineWhen;
  option = option.padEnd(optionsCols, ' ');

  return wrapAnsi(description || '', descCols)
    .split('\n')
    .map((part, index) => {
      const main = index === 0 ? option + (longOption ? '\n' : '') : '';
      const space = index !== 0 || longOption ? ' '.repeat(optionsCols) : '';
      return main + space + part;
    })
    .join('\n');
}

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
    {
      option: '-q, --quiet',
      description:
        "set log level to 'error' or set its default with '--no-quiet' flag"
    },
    {
      option: '--log-level <level>',
      description:
        "output logs only of equal or higher level ('info', 'warn', 'error', default: 'info')"
    },

    {
      option: '-v, --version',
      description: 'output the version number'
    },
    {
      option: '-h, --help',
      description: 'display help for command'
    }
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

  const usageText = 'Usage:';
  const usage = ' '.repeat(usageText.length + 1) + PKG.name + ' ';

  const output: string[] = [];
  output.push(PKG.description);
  output.push('');
  output.push(
    `${usageText} ${PKG.name} [-n|--dry-run] [src...] [options] [--] [src...]`
  );
  output.push(usage + '<src...> -d|--dests <dest...>');
  output.push(usage + '<src...> --dest <dest1> [--dest <dest2>]');
  output.push(
    usage +
      '-l|--link <src1...> -t|--to <dest1...> [-l <src2...> -t <dest2...>]'
  );
  output.push(usage + '-C|--cwd <path> ...');
  output.push(
    usage + "-c|--configs <[*.json...] [-] [*.json...]> # stdin '-' json format"
  );
  output.push(
    usage + '--config <config1.json> [--config - --config <config3.json>]'
  );
  output.push('');
  output.push('Arguments');
  output.push(
    renderOption(
      '[src...]',
      'paths of source packages to link to destination packages ' +
        "(required only when '--link' and '--to' options are not used)"
    )
  );
  output.push('');
  output.push('Link package options');
  for (const o of next(7)) {
    output.push(renderOption(o.option, o.description));
  }
  output.push('');
  output.push("Flags (use '--<flag>=0' or '--no-<flag>' to set to false)");
  for (const o of next(6)) {
    output.push(renderOption(o.option, o.description));
  }
  output.push('');
  output.push('Output options');
  for (const o of next(4)) {
    output.push(renderOption(o.option, o.description));
  }

  return output.join('\n');
}
