import { LnPkgOptions, PathMap } from '../types/core.types';

export interface NormalizedOptions {
  paths: PathMap[];
  // uniquePaths: string[];
  clean: boolean;
}

export function normalizeOptions(options: LnPkgOptions): NormalizedOptions {
  const paths = options.paths || [];
  if (paths.length === 0) {
    throw new Error('No paths specified.');
  }

  const allPaths: NormalizedOptions['paths'] = [];
  const add = (pathMap: PathMap) => {
    // check if path map already exists
    const exists = allPaths.some(
      existing => existing.src === pathMap.src && existing.dest === pathMap.dest
    );
    if (!exists) {
      allPaths.push(pathMap);
    }
  };

  for (const pathValue of paths) {
    if (typeof pathValue === 'string') {
      // check target
      if (!options.target || typeof options.target !== 'string') {
        throw new Error('Missing "target" path option.');
      }
      add({ src: pathValue, dest: options.target });
    } else if (
      pathValue &&
      typeof pathValue === 'object' &&
      pathValue.src &&
      typeof pathValue.src === 'string' &&
      pathValue.dest &&
      typeof pathValue.dest === 'string'
    ) {
      add(pathValue);
    } else {
      throw new Error(`${pathValue}: not a valid path map`);
    }
  }

  const normalizedOptions: NormalizedOptions = {
    clean: options.clean || false,
    paths: allPaths
  };
  return normalizedOptions;
}
