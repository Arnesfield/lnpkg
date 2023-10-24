export function formatTime(date: Date): string {
  let hours = date.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const time = [hours, date.getMinutes(), date.getSeconds()]
    .map(value => (value < 10 ? '0' + value : value))
    .join(':');
  return time + ' ' + ampm;
}
