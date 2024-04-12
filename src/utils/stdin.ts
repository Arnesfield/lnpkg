/**
 * Get input from stdin.
 * @returns The input value.
 */
export async function stdin(): Promise<string> {
  // NOTE: taken from:
  // https://github.com/sindresorhus/get-stdin
  // https://stackoverflow.com/a/16351842/7013346
  let result = '';
  for await (const chunk of process.stdin.setEncoding('utf8')) {
    result += chunk;
  }
  return result;
}
