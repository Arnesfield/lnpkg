// NOTE: GENERATE HELP TEXT TO BE REPLACED IN BUILD.
// for some reason, json plugin does not work for this
// so import package.json directly

import wrapAnsi from 'wrap-ansi';
import PKG from '../package.json' with { type: 'json' };

const columns = 80;
const optionsCols = 28;
const descCols = columns - optionsCols;

export function helpText(): string {
  const opts = [
    {
      option: '-d, --dests <paths...>',
      description: 'default destination package(s) to link source packages to'
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
      description: 'disable logging'
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

  const output: string[] = [];
  output.push(PKG.description);
  output.push('');
  output.push(`Usage: ${PKG.name} [paths...] [options]`);
  output.push('');
  output.push('Options:');
  output.push('');
  output.push('Package and path options');
  let _curr = 0;
  function next(count: number) {
    const end = _curr + count;
    const arr = opts.slice(_curr, end);
    _curr = end;
    return arr;
  }
  for (const o of next(2)) {
    output.push(renderOption(o.option, o.description));
  }
  output.push('');
  for (const o of next(2)) {
    output.push(renderOption(o.option, o.description));
  }

  output.push('');
  for (const o of next(1)) {
    output.push(renderOption(o.option, o.description));
  }
  output.push('');
  for (const o of next(2)) {
    output.push(renderOption(o.option, o.description));
  }
  output.push('');
  output.push('Flags (set `<flag>=0` or use `--no-` prefix to negate)');
  for (const o of next(6)) {
    output.push(renderOption(o.option, o.description));
  }
  output.push('');
  output.push('Logging options');
  for (const o of next(2)) {
    output.push(renderOption(o.option, o.description));
  }
  output.push('');
  for (const o of next(2)) {
    output.push(renderOption(o.option, o.description));
  }

  return output.join('\n');
}

function renderOption(option: string, description?: string) {
  const spaceLength = option.startsWith('--') ? 6 : 2;
  option = ' '.repeat(spaceLength) + option;

  const longOption = option.length > optionsCols - 1;
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
