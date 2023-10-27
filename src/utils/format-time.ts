export function formatTime(date: Date): string {
  return [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map(value => (value < 10 ? '0' + value : value))
    .join(':');
}
