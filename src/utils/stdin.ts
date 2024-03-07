/**
 * Get input from stdin.
 * @returns The input value.
 */
export function stdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    // NOTE: taken from https://stackoverflow.com/a/16351842/7013346
    const chunks: string[] = [];
    process
      .openStdin()
      .setEncoding('utf8')
      .on('data', chunk => chunks.push(chunk))
      .on('error', reject)
      .on('end', () => resolve(chunks.join('')));
  });
}
