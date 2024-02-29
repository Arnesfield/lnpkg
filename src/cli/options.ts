import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { LnPkgOptions } from '../types/core.types';
import { cwd } from '../utils/cwd';
import { getStdin } from '../utils/stdin';
import { ProgramOptions } from './command';

export async function parseOptions(command: Command): Promise<LnPkgOptions> {
  const paths = command.processedArgs[0];
  const options = command.opts<ProgramOptions>();

  // parse json config, use provided cwd to resolve config path
  const buffer =
    options.config === '-'
      ? await getStdin()
      : typeof options.config === 'string'
      ? await fs.promises.readFile(
          path.resolve(cwd(options.cwd), options.config)
        )
      : undefined;
  const config: LnPkgOptions = buffer ? JSON.parse(buffer.toString()) : {};
  // in case options.config is not a valid object
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error('Unable to parse config.');
  }

  // make sure inputs have sources
  const inputs = options.link || [];
  for (const input of inputs) {
    if (input.dest.length === 0) {
      command.error("error: missing '-t, --to' after '-l, --link'");
    }
  }

  // merge options, prioritize options over json
  config.cwd = options.cwd ?? config.cwd;
  config.dryRun = options.dryRun ?? config.dryRun;
  config.force = options.force ?? config.force;
  config.skip = options.skip ?? config.skip;
  config.watch = options.watch ?? config.watch;
  config.watchOnly = options.watchOnly ?? config.watchOnly;

  options.dest = Array.isArray(options.dest) ? options.dest : [];
  config.dest = Array.isArray(config.dest)
    ? config.dest
    : typeof config.dest === 'string'
    ? [config.dest]
    : [];
  config.dest = options.dest.concat(config.dest);
  if (config.dest.length === 0) {
    config.dest.push('.');
  }

  config.input = Array.isArray(config.input)
    ? config.input
    : config.input != null
    ? [config.input]
    : [];
  config.input = paths.concat(inputs, config.input);

  return config;
}
