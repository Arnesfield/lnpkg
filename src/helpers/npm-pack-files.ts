import { spawn } from 'child_process';

interface NpmPackData {
  // omit unused properties
  files: { path: string }[];
}

export interface NpmPackOptions {
  cwd: string;
}

// TODO: try with and without workspaces!

/**
 * Run `npm pack` in provided directory.
 * @param options The options.
 * @returns List of package file relative paths.
 */
export async function npmPackFiles(options: NpmPackOptions): Promise<string[]> {
  const { cwd } = options;
  const chunks: string[] = [];
  const pack = spawn('npm', ['pack', '--json', '--dry-run'], { cwd });
  pack.stdout.setEncoding('utf8').on('data', chunk => chunks.push(chunk));

  const promise = new Promise<string>((resolve, reject) => {
    pack
      .on('error', error => reject(error))
      .on('close', () => resolve(chunks.join('')));
  });

  try {
    const data = await promise;
    const json = JSON.parse(data);
    const res: NpmPackData[] = Array.isArray(json) ? json : json ? [json] : [];
    // get files of first package only (relative paths)
    return (res[0]?.files || []).map(file => file.path);
  } catch {
    return [];
  }
}
