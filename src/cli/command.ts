import { Command, Option } from 'commander';
import { description, name, version } from '../../package.json';

export interface ProgramInput {
  src: string[];
  dest: string[];
}

export interface ProgramOptions {
  dest?: string[];
  dests?: string[];
  link?: ProgramInput[];
  cwd?: string;
  config?: string[];
  configs?: string[];
  dryRun?: boolean;
  force?: boolean;
  skip?: boolean;
  watch?: boolean;
  watchOnly?: boolean;
}

// keep array reference
function createArrayParser(defaultValue: string[] = []) {
  return (value: string, previous = defaultValue) => (
    previous.push(value), previous
  );
}

export function createCommand(): Command {
  // NOTE: '--link' option may break if commander changes how it parses options
  let input: ProgramInput = { src: [], dest: [] };
  let saved = false;

  const parseDest = createArrayParser();
  const destsOption = new Option(
    '    --dests <...>',
    "similar to '--dest' but accepts multiple paths"
  ).argParser(parseDest);
  destsOption.variadic = true;

  const parseConfig = createArrayParser();
  const configsOption = new Option(
    '    --configs <...>',
    "similar to '--config' but accepts multiple file paths"
  ).argParser(parseConfig);
  configsOption.variadic = true;

  const command = new Command()
    .name(name)
    .addHelpText('before', description + '\n')
    .argument('[paths...]', 'paths of source packages to link')
    .option('-n, --dry-run', 'log only without performing operations (noop)')
    .option(
      '-d, --dest <path>',
      'default destination package(s) to link source packages to',
      parseDest
    )
    .addOption(destsOption)
    .option<ProgramInput[]>(
      '-l, --link <paths...>',
      "source packages to link to proceeding '--to' destination packages",
      (value, previous = [input]) => {
        if (saved) {
          saved = false;
          if (input.src.length > 0 || input.dest.length > 0) {
            input = { src: [], dest: [] };
            previous.push(input);
          }
        }
        input.src.push(value);
        return previous;
      }
    )
    .option(
      '-t, --to <paths...>',
      "destination packages for preceding '--link' source packages",
      value => {
        if (input.src.length === 0) {
          command.error(
            "error: missing option '-l, --link <paths...>' before option '-t, --to'"
          );
        }
        saved = true;
        input.dest.push(value);
      }
    )
    .option(
      '-C, --cwd <path>',
      'run command as if it was started in <path> instead of the current working directory'
    )
    .option(
      '-c, --config <path>',
      "file path to config(s) or '-' for stdin (json format)",
      parseConfig
    )
    .addOption(configsOption)
    // use implies for toggling to properly override config options
    .addOption(
      new Option(
        '-f, --force',
        'allow link even if source package is not a dependency of destination package'
      ).implies({ skip: false })
    )
    .addOption(
      new Option(
        '-s, --skip',
        'skip link if source package is not a dependency of destination package'
      ).implies({ force: false })
    )
    .addOption(
      new Option(
        '-w, --watch',
        'watch package files for changes after linking packages'
      ).implies({ watchOnly: false })
    )
    .addOption(
      new Option(
        '-W, --watch-only',
        'skip linking packages and watch package files for changes only'
      ).implies({ watch: false })
    )
    .version(`v${version}`, '-v, --version');
  // add hidden `--no` option for boolean options
  // NOTE: taken from https://github.com/tj/commander.js/issues/1343#issuecomment-699546401
  const match = /^--/;
  for (const option of command.options) {
    if (option.long && !option.required && !option.negate && !option.optional) {
      command.addOption(
        new Option(option.long.replace(match, '--no-')).hideHelp()
      );
    }
  }
  return command;
}
