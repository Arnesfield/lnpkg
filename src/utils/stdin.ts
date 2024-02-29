/**
 * Get buffer from stdin.
 * @returns The buffer.
 */
export function getStdin(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // NOTE: taken from https://stackoverflow.com/a/16351842/7013346
    const chunks: Buffer[] = [];
    process
      .openStdin()
      .on('data', chunk => chunks.push(chunk))
      .on('error', reject)
      .on('end', () => resolve(Buffer.concat(chunks)));
  });
}
